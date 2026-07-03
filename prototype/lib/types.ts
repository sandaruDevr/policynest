export interface Tenant {
  id: string
  name: string
  industry?: string
  country?: string
  state_or_territory?: string
  created_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  full_name?: string
  role: 'organisation_admin' | 'staff' | 'compliance_manager' | 'clinical_manager' | 'auditor' | 'platform_admin'
  site_id?: string
  created_at: string
}

export interface Document {
  id: string
  tenant_id: string
  title: string
  document_type?: string
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'superseded' | 'archived'
  version: string
  storage_path?: string
  effective_date?: string
  expiry_date?: string
  sector?: string
  framework?: string[]
  risk_level?: string
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  tenant_id: string
  document_id: string
  content: string
  section_title?: string
  section_number?: string
  chunk_index: number
  allowed_roles: string[]
  site_ids: string[]
  language: string
  metadata: Record<string, any>
  embedding?: number[]
  created_at: string
}

export interface RAGAuditLog {
  id: string
  tenant_id: string
  user_id?: string
  query: string
  answer?: string
  retrieved_chunks: any[]
  citations: any[]
  confidence?: number
  escalated: boolean
  model_name?: string
  model_version?: string
  created_at: string
}

export interface HITLQueueItem {
  id: string
  tenant_id: string
  user_id?: string
  query: string
  draft_answer?: string
  retrieved_chunks: any[]
  confidence?: number
  risk_level?: string
  status: 'pending' | 'approved' | 'rejected' | 'corrected'
  reviewer_id?: string
  reviewed_answer?: string
  created_at: string
  reviewed_at?: string
}

export interface GoldenAnswer {
  id: string
  tenant_id: string
  question_pattern: string
  approved_answer: string
  citations: any[]
  framework?: string[]
  risk_level?: string
  status: 'active' | 'inactive' | 'archived'
  approved_by?: string
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  tenant_id: string
  submitted_by?: string
  incident_type: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  status: 'draft' | 'submitted' | 'reviewing' | 'closed'
  ai_suggested_next_steps?: string
  created_at: string
}

export interface RAGResponse {
  answer: string
  steps: Array<{
    step: string
    citation: {
      document_id: string
      title: string
      version: string
      section_title: string
      chunk_id: string
    }
  }>
  citations: Array<{
    document_id: string
    title: string
    version: string
    section_title: string
    chunk_id: string
  }>
  confidence: number
  requires_escalation: boolean
  forms_required: string[]
  notifications_required: string[]
}
