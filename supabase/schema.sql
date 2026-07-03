-- CareSuite AI Database Schema
-- Tenant-isolated RAG-based compliance platform

-- Enable required extensions
create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto;

-- Tenants table
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  country text default 'Australia',
  state_or_territory text,
  created_at timestamptz not null default now()
);

-- Profiles table (linked to Supabase Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  full_name text,
  role text not null default 'staff',
  site_id uuid,
  created_at timestamptz not null default now()
);

-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references tenants(id) on delete cascade,

  title text not null,
  document_type text,

  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'published', 'superseded', 'archived')),

  version text default 'v1.0',
  storage_path text,

  effective_date date,
  expiry_date date,

  sector text,
  framework text[],
  risk_level text,

  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document chunks table with embeddings
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,

  content text not null,

  section_title text,
  section_number text,
  chunk_index int not null default 0,

  allowed_roles text[] default '{}',
  site_ids uuid[] default '{}',
  language text default 'en',

  metadata jsonb not null default '{}',

  embedding extensions.vector(3072) not null,

  created_at timestamptz not null default now()
);

-- Indexes for vector search and performance
create index if not exists document_chunks_embedding_idx
on document_chunks
using ivfflat (embedding extensions.vector_cosine_ops)
with (lists = 100);

create index if not exists document_chunks_tenant_idx
on document_chunks (tenant_id);

create index if not exists documents_tenant_status_idx
on documents (tenant_id, status);

create index if not exists document_chunks_metadata_idx
on document_chunks
using gin (metadata);

create index if not exists document_chunks_allowed_roles_idx
on document_chunks
using gin (allowed_roles);

create index if not exists documents_framework_idx
on documents
using gin (framework);

-- Function to match tenant documents with vector similarity
create or replace function match_tenant_documents (
  query_embedding extensions.vector(3072),
  input_tenant_id uuid,
  match_count int default 8,
  input_user_role text default null,
  input_site_id uuid default null,
  filter jsonb default '{}',
  min_similarity float default 0.0
)
returns table (
  chunk_id uuid,
  document_id uuid,
  tenant_id uuid,
  content text,
  title text,
  document_type text,
  version text,
  section_title text,
  section_number text,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    dc.id as chunk_id,
    dc.document_id,
    dc.tenant_id,
    dc.content,
    d.title,
    d.document_type,
    d.version,
    dc.section_title,
    dc.section_number,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.tenant_id = input_tenant_id
    and d.tenant_id = input_tenant_id
    and d.status in ('approved', 'published')
    and (
      d.expiry_date is null
      or d.expiry_date >= current_date
    )
    and (
      d.effective_date is null
      or d.effective_date <= current_date
    )
    and (
      input_user_role is null
      or dc.allowed_roles = '{}'
      or input_user_role = any(dc.allowed_roles)
    )
    and (
      input_site_id is null
      or dc.site_ids = '{}'
      or input_site_id = any(dc.site_ids)
    )
    and dc.metadata @> filter
    and (
      1 - (dc.embedding <=> query_embedding)
    ) >= min_similarity
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RAG audit logs table
create table if not exists rag_audit_logs (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references profiles(id),

  query text not null,
  answer text,
  retrieved_chunks jsonb default '[]',
  citations jsonb default '[]',

  confidence numeric,
  escalated boolean not null default false,

  model_name text,
  model_version text,

  created_at timestamptz not null default now()
);

-- HITL (Human-in-the-loop) review queue
create table if not exists hitl_queue (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references profiles(id),

  query text not null,
  draft_answer text,
  retrieved_chunks jsonb default '[]',

  confidence numeric,
  risk_level text,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'corrected')),

  reviewer_id uuid references profiles(id),
  reviewed_answer text,

  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Golden answers table
create table if not exists golden_answers (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references tenants(id) on delete cascade,

  question_pattern text not null,
  approved_answer text not null,

  citations jsonb default '[]',
  framework text[],
  risk_level text,

  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),

  approved_by uuid references profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Incidents table
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references tenants(id) on delete cascade,
  submitted_by uuid references profiles(id),

  incident_type text not null,
  description text not null,
  urgency text default 'medium',
  status text default 'submitted'
    check (status in ('draft', 'submitted', 'reviewing', 'closed')),

  ai_suggested_next_steps text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table rag_audit_logs enable row level security;
alter table hitl_queue enable row level security;
alter table golden_answers enable row level security;
alter table incidents enable row level security;

-- Helper function to get current user's tenant_id
create or replace function current_user_tenant_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select tenant_id
  from profiles
  where id = auth.uid()
  limit 1;
$$;

-- RLS Policies

-- Profiles
create policy "Users can view own profile"
on profiles
for select
using (id = auth.uid());

-- Tenants
create policy "Users can view own tenant"
on tenants
for select
using (id = current_user_tenant_id());

-- Documents
create policy "Tenant users can view own documents"
on documents
for select
using (tenant_id = current_user_tenant_id());

create policy "Tenant admins can insert documents"
on documents
for insert
with check (
  tenant_id = current_user_tenant_id()
  and exists (
    select 1
    from profiles
    where id = auth.uid()
      and role in ('organisation_admin', 'compliance_manager', 'platform_admin')
  )
);

create policy "Tenant admins can update documents"
on documents
for update
using (
  tenant_id = current_user_tenant_id()
  and exists (
    select 1
    from profiles
    where id = auth.uid()
      and role in ('organisation_admin', 'compliance_manager', 'platform_admin')
  )
)
with check (
  tenant_id = current_user_tenant_id()
);

-- Document chunks
create policy "Tenant users can view own document chunks"
on document_chunks
for select
using (tenant_id = current_user_tenant_id());

create policy "Tenant admins can insert chunks"
on document_chunks
for insert
with check (
  tenant_id = current_user_tenant_id()
  and exists (
    select 1
    from profiles
    where id = auth.uid()
      and role in ('organisation_admin', 'compliance_manager', 'platform_admin')
  )
);

create policy "Tenant admins can update chunks"
on document_chunks
for update
using (
  tenant_id = current_user_tenant_id()
  and exists (
    select 1
    from profiles
    where id = auth.uid()
      and role in ('organisation_admin', 'compliance_manager', 'platform_admin')
  )
)
with check (
  tenant_id = current_user_tenant_id()
);

-- RAG audit logs
create policy "Tenant users can view own RAG logs"
on rag_audit_logs
for select
using (tenant_id = current_user_tenant_id());

create policy "Tenant users can insert own RAG logs"
on rag_audit_logs
for insert
with check (tenant_id = current_user_tenant_id());

-- HITL queue
create policy "Tenant users can view own HITL queue"
on hitl_queue
for select
using (tenant_id = current_user_tenant_id());

create policy "Tenant admins can manage HITL"
on hitl_queue
for all
using (
  tenant_id = current_user_tenant_id()
  and exists (
    select 1
    from profiles
    where id = auth.uid()
      and role in ('organisation_admin', 'compliance_manager', 'platform_admin')
  )
)
with check (
  tenant_id = current_user_tenant_id()
);

-- Golden answers
create policy "Tenant users can view own golden answers"
on golden_answers
for select
using (tenant_id = current_user_tenant_id());

create policy "Tenant admins can manage golden answers"
on golden_answers
for all
using (
  tenant_id = current_user_tenant_id()
  and exists (
    select 1
    from profiles
    where id = auth.uid()
      and role in ('organisation_admin', 'compliance_manager', 'platform_admin')
  )
)
with check (
  tenant_id = current_user_tenant_id()
);

-- Incidents
create policy "Tenant users can view own incidents"
on incidents
for select
using (tenant_id = current_user_tenant_id());

create policy "Tenant users can insert own incidents"
on incidents
for insert
with check (tenant_id = current_user_tenant_id());

-- Trigger for updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_documents_updated_at
before update on documents
for each row
execute function set_updated_at();

create trigger set_golden_answers_updated_at
before update on golden_answers
for each row
execute function set_updated_at();
