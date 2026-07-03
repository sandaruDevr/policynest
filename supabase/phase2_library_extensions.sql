-- Phase 2 Library Schema Extensions
-- Adds document_sections, document_related, document_bookmarks, document_acknowledgements
-- Adds FTS support on documents
-- Adds RLS policies for staff role

-- 1. Extend documents table with library-specific columns
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS pillar text,
  ADD COLUMN IF NOT EXISTS tags text[] default '{}',
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS short_title text,
  ADD COLUMN IF NOT EXISTS acknowledgement_required boolean default false,
  ADD COLUMN IF NOT EXISTS offline_available boolean default false,
  ADD COLUMN IF NOT EXISTS emergency_related boolean default false,
  ADD COLUMN IF NOT EXISTS estimated_read_minutes int,
  ADD COLUMN IF NOT EXISTS roles_relevant text[];

-- 2. Add FTS support on documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION documents_search_trigger()
RETURNS trigger AS $$
begin
  new.search_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
end;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_search_update ON documents;
CREATE TRIGGER documents_search_update
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_search_trigger();

-- Index for FTS
CREATE INDEX IF NOT EXISTS documents_search_idx ON documents USING gin(search_tsv);

-- 3. Create document_sections table
CREATE TABLE IF NOT EXISTS document_sections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  anchor text not null,
  title text not null,
  body text,
  ord int not null default 0,
  created_at timestamptz not null default now(),
  UNIQUE(document_id, anchor)
);

-- 4. Create document_related table
CREATE TABLE IF NOT EXISTS document_related (
  document_id uuid not null references documents(id) on delete cascade,
  related_id text not null,
  related_type text not null check (related_type in ('form', 'faq', 'policy', 'procedure')),
  title text not null,
  primary key(document_id, related_id)
);

-- 5. Create document_bookmarks table
CREATE TABLE IF NOT EXISTS document_bookmarks (
  profile_id uuid not null references profiles(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(profile_id, document_id)
);

-- 6. Create document_acknowledgements table
CREATE TABLE IF NOT EXISTS document_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  version text not null,
  signed_at timestamptz not null default now(),
  unique(profile_id, document_id, version)
);

-- 7. Enable RLS on new tables
ALTER TABLE document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_related ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acknowledgements ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for document_sections
DROP POLICY IF EXISTS "Tenant users can view own document sections" ON document_sections;
CREATE POLICY "Tenant users can view own document sections"
ON document_sections
FOR SELECT
USING (tenant_id = current_user_tenant_id());

-- 9. RLS Policies for document_related
DROP POLICY IF EXISTS "Tenant users can view own document related" ON document_related;
CREATE POLICY "Tenant users can view own document related"
ON document_related
FOR SELECT
USING (
  document_id IN (
    SELECT id FROM documents WHERE tenant_id = current_user_tenant_id()
  )
);

-- 10. RLS Policies for document_bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON document_bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON document_bookmarks;
CREATE POLICY "Users can view own bookmarks"
ON document_bookmarks
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

CREATE POLICY "Users can insert own bookmarks"
ON document_bookmarks
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON document_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
ON document_bookmarks
FOR DELETE
USING (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

-- 11. RLS Policies for document_acknowledgements
DROP POLICY IF EXISTS "Users can view own acknowledgements" ON document_acknowledgements;
DROP POLICY IF EXISTS "Users can insert own acknowledgements" ON document_acknowledgements;
CREATE POLICY "Users can view own acknowledgements"
ON document_acknowledgements
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

CREATE POLICY "Users can insert own acknowledgements"
ON document_acknowledgements
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS document_sections_document_idx ON document_sections(document_id);
CREATE INDEX IF NOT EXISTS document_sections_tenant_idx ON document_sections(tenant_id);
CREATE INDEX IF NOT EXISTS document_bookmarks_profile_idx ON document_bookmarks(profile_id);
CREATE INDEX IF NOT EXISTS document_bookmarks_tenant_idx ON document_bookmarks(tenant_id);
CREATE INDEX IF NOT EXISTS document_acknowledgements_profile_idx ON document_acknowledgements(profile_id);
CREATE INDEX IF NOT EXISTS document_acknowledgements_document_idx ON document_acknowledgements(document_id);
CREATE INDEX IF NOT EXISTS document_acknowledgements_tenant_idx ON document_acknowledgements(tenant_id);
