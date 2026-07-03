/**
 * Supabase database types.
 *
 * This is a minimal placeholder to satisfy imports during Phase 1.
 * After applying schema extensions in Step 8, regenerate this file via:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/lib/supabase/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          industry: string | null
          country: string
          state_or_territory: string | null
          status: string
          plan: string
          is_platform: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          country?: string
          state_or_territory?: string | null
          status?: string
          plan?: string
          is_platform?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          country?: string
          state_or_territory?: string | null
          status?: string
          plan?: string
          is_platform?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          full_name: string | null
          role: string
          site_id: string | null
          created_at: string
          preferred_name: string | null
          staff_role: string | null
          sectors: string[] | null
          primary_sector: string | null
          locale: string
          presence: string
          last_sync_at: string | null
          avatar_url: string | null
          email: string | null
          job_title: string | null
          phone: string | null
          status: string
        }
        Insert: {
          id: string
          tenant_id: string
          full_name?: string | null
          role?: string
          site_id?: string | null
          created_at?: string
          preferred_name?: string | null
          staff_role?: string | null
          sectors?: string[] | null
          primary_sector?: string | null
          locale?: string
          presence?: string
          last_sync_at?: string | null
          avatar_url?: string | null
          email?: string | null
          job_title?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          full_name?: string | null
          role?: string
          site_id?: string | null
          created_at?: string
          preferred_name?: string | null
          staff_role?: string | null
          sectors?: string[] | null
          primary_sector?: string | null
          locale?: string
          presence?: string
          last_sync_at?: string | null
          avatar_url?: string | null
          email?: string | null
          job_title?: string | null
          phone?: string | null
          status?: string
        }
      }
      documents: {
        Row: {
          id: string
          tenant_id: string
          title: string
          document_type: string | null
          status: string
          version: string
          storage_path: string | null
          effective_date: string | null
          expiry_date: string | null
          sector: string | null
          framework: string[] | null
          risk_level: string | null
          created_by: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
          category: string | null
          pillar: string | null
          tags: string[] | null
          summary: string | null
          short_title: string | null
          acknowledgement_required: boolean
          offline_available: boolean
          emergency_related: boolean
          estimated_read_minutes: number | null
          roles_relevant: string[] | null
          search_tsv: unknown
          origin_type: string
          source_template_id: string | null
          parent_document_id: string | null
          owner_id: string | null
          site_ids: string[] | null
          published_at: string | null
          published_by: string | null
          review_due_at: string | null
          change_reason: string | null
          content: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          document_type?: string | null
          status?: string
          version?: string
          storage_path?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          sector?: string | null
          framework?: string[] | null
          risk_level?: string | null
          created_by?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
          category?: string | null
          pillar?: string | null
          tags?: string[] | null
          summary?: string | null
          short_title?: string | null
          acknowledgement_required?: boolean
          offline_available?: boolean
          emergency_related?: boolean
          estimated_read_minutes?: number | null
          roles_relevant?: string[] | null
          search_tsv?: unknown
          origin_type?: string
          source_template_id?: string | null
          parent_document_id?: string | null
          owner_id?: string | null
          site_ids?: string[] | null
          published_at?: string | null
          published_by?: string | null
          review_due_at?: string | null
          change_reason?: string | null
          content?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          document_type?: string | null
          status?: string
          version?: string
          storage_path?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          sector?: string | null
          framework?: string[] | null
          risk_level?: string | null
          created_by?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
          category?: string | null
          pillar?: string | null
          tags?: string[] | null
          summary?: string | null
          short_title?: string | null
          acknowledgement_required?: boolean
          offline_available?: boolean
          emergency_related?: boolean
          estimated_read_minutes?: number | null
          roles_relevant?: string[] | null
          search_tsv?: unknown
          origin_type?: string
          source_template_id?: string | null
          parent_document_id?: string | null
          owner_id?: string | null
          site_ids?: string[] | null
          published_at?: string | null
          published_by?: string | null
          review_due_at?: string | null
          change_reason?: string | null
          content?: string | null
        }
      }
      document_chunks: {
        Row: {
          id: string
          tenant_id: string
          document_id: string
          content: string
          section_title: string | null
          section_number: string | null
          chunk_index: number
          allowed_roles: string[] | null
          site_ids: string[] | null
          language: string | null
          metadata: Json
          embedding: unknown
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          document_id: string
          content: string
          section_title?: string | null
          section_number?: string | null
          chunk_index?: number
          allowed_roles?: string[] | null
          site_ids?: string[] | null
          language?: string | null
          metadata?: Json
          embedding: unknown
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          document_id?: string
          content?: string
          section_title?: string | null
          section_number?: string | null
          chunk_index?: number
          allowed_roles?: string[] | null
          site_ids?: string[] | null
          language?: string | null
          metadata?: Json
          embedding?: unknown
          created_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          tenant_id: string
          submitted_by: string | null
          incident_type: string
          description: string
          urgency: string
          status: string
          ai_suggested_next_steps: string | null
          created_at: string
          reference: string | null
          severity: string | null
          category: string | null
          location: string | null
          immediate_actions: string | null
          witnesses: string | null
          notified_parties: string | null
          attachments: Json
          timeline: Json
          follow_up_required: boolean
          occurred_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          submitted_by?: string | null
          incident_type: string
          description: string
          urgency?: string
          status?: string
          ai_suggested_next_steps?: string | null
          created_at?: string
          reference?: string | null
          severity?: string | null
          category?: string | null
          location?: string | null
          immediate_actions?: string | null
          witnesses?: string | null
          notified_parties?: string | null
          attachments?: Json
          timeline?: Json
          follow_up_required?: boolean
          occurred_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          submitted_by?: string | null
          incident_type?: string
          description?: string
          urgency?: string
          status?: string
          ai_suggested_next_steps?: string | null
          created_at?: string
          reference?: string | null
          severity?: string | null
          category?: string | null
          location?: string | null
          immediate_actions?: string | null
          witnesses?: string | null
          notified_parties?: string | null
          attachments?: Json
          timeline?: Json
          follow_up_required?: boolean
          occurred_at?: string | null
        }
      }
      sites: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: string | null
          code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          address?: string | null
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          address?: string | null
          code?: string | null
          created_at?: string
        }
      }
      staff_shifts: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string | null
          starts_at: string
          ends_at: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id?: string | null
          starts_at: string
          ends_at: string
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string | null
          starts_at?: string
          ends_at?: string
          label?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string | null
          category: string
          level: string
          title: string
          body: string | null
          at: string
          read: boolean
          href: string | null
          action_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id?: string | null
          category: string
          level: string
          title: string
          body?: string | null
          at?: string
          read?: boolean
          href?: string | null
          action_label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string | null
          category?: string
          level?: string
          title?: string
          body?: string | null
          at?: string
          read?: boolean
          href?: string | null
          action_label?: string | null
          created_at?: string
        }
      }
      rag_audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          query: string
          answer: string | null
          retrieved_chunks: Json
          citations: Json
          confidence: number | null
          escalated: boolean
          model_name: string | null
          model_version: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          query: string
          answer?: string | null
          retrieved_chunks?: Json
          citations?: Json
          confidence?: number | null
          escalated?: boolean
          model_name?: string | null
          model_version?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          query?: string
          answer?: string | null
          retrieved_chunks?: Json
          citations?: Json
          confidence?: number | null
          escalated?: boolean
          model_name?: string | null
          model_version?: string | null
          created_at?: string
        }
      }
      hitl_queue: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          query: string
          draft_answer: string | null
          retrieved_chunks: Json
          confidence: number | null
          risk_level: string | null
          status: string
          reviewer_id: string | null
          reviewed_answer: string | null
          review_notes: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          query: string
          draft_answer?: string | null
          retrieved_chunks?: Json
          confidence?: number | null
          risk_level?: string | null
          status?: string
          reviewer_id?: string | null
          reviewed_answer?: string | null
          review_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          query?: string
          draft_answer?: string | null
          retrieved_chunks?: Json
          confidence?: number | null
          risk_level?: string | null
          status?: string
          reviewer_id?: string | null
          reviewed_answer?: string | null
          review_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }
      golden_answers: {
        Row: {
          id: string
          tenant_id: string
          question_pattern: string
          approved_answer: string
          citations: Json
          framework: string[] | null
          risk_level: string | null
          status: string
          approved_by: string | null
          source_hitl_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          question_pattern: string
          approved_answer: string
          citations?: Json
          framework?: string[] | null
          risk_level?: string | null
          status?: string
          approved_by?: string | null
          source_hitl_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          question_pattern?: string
          approved_answer?: string
          citations?: Json
          framework?: string[] | null
          risk_level?: string | null
          status?: string
          approved_by?: string | null
          source_hitl_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenant_ai_settings: {
        Row: {
          tenant_id: string
          assistant_enabled: boolean
          hitl_confidence_threshold: number
          escalate_high_risk: boolean
          golden_answers_enabled: boolean
          min_retrieval_similarity: number
          retrieval_top_k: number
          custom_guidance: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          assistant_enabled?: boolean
          hitl_confidence_threshold?: number
          escalate_high_risk?: boolean
          golden_answers_enabled?: boolean
          min_retrieval_similarity?: number
          retrieval_top_k?: number
          custom_guidance?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          assistant_enabled?: boolean
          hitl_confidence_threshold?: number
          escalate_high_risk?: boolean
          golden_answers_enabled?: boolean
          min_retrieval_similarity?: number
          retrieval_top_k?: number
          custom_guidance?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_sections: {
        Row: {
          id: string
          tenant_id: string
          document_id: string
          anchor: string
          title: string
          body: string | null
          ord: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          document_id: string
          anchor: string
          title: string
          body?: string | null
          ord?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          document_id?: string
          anchor?: string
          title?: string
          body?: string | null
          ord?: number
          created_at?: string
        }
      }
      document_related: {
        Row: {
          document_id: string
          related_id: string
          related_type: string
          title: string
        }
        Insert: {
          document_id: string
          related_id: string
          related_type: string
          title: string
        }
        Update: {
          document_id?: string
          related_id?: string
          related_type?: string
          title?: string
        }
      }
      document_bookmarks: {
        Row: {
          profile_id: string
          tenant_id: string
          document_id: string
          created_at: string
        }
        Insert: {
          profile_id: string
          tenant_id: string
          document_id: string
          created_at?: string
        }
        Update: {
          profile_id?: string
          tenant_id?: string
          document_id?: string
          created_at?: string
        }
      }
      document_acknowledgements: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          document_id: string
          version: string
          signed_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id: string
          document_id: string
          version: string
          signed_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string
          document_id?: string
          version?: string
          signed_at?: string
        }
      }
      training_modules: {
        Row: {
          id: string
          tenant_id: string
          title: string
          type: string
          category: string | null
          duration_minutes: number | null
          required: boolean | null
          roles_relevant: string[] | null
          linked_policy_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          type: string
          category?: string | null
          duration_minutes?: number | null
          required?: boolean | null
          roles_relevant?: string[] | null
          linked_policy_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          type?: string
          category?: string | null
          duration_minutes?: number | null
          required?: boolean | null
          roles_relevant?: string[] | null
          linked_policy_id?: string | null
          created_at?: string
        }
      }
      training_assignments: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          module_id: string
          status: string
          progress_percent: number | null
          due_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id: string
          module_id: string
          status?: string
          progress_percent?: number | null
          due_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string
          module_id?: string
          status?: string
          progress_percent?: number | null
          due_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      induction_steps: {
        Row: {
          id: string
          tenant_id: string
          ord: number
          title: string
          type: string
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          ord?: number
          title: string
          type: string
          duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          ord?: number
          title?: string
          type?: string
          duration_minutes?: number | null
          created_at?: string
        }
      }
      induction_progress: {
        Row: {
          profile_id: string
          step_id: string
          status: string
          completed_at: string | null
        }
        Insert: {
          profile_id: string
          step_id: string
          status?: string
          completed_at?: string | null
        }
        Update: {
          profile_id?: string
          step_id?: string
          status?: string
          completed_at?: string | null
        }
      }
      credentials: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          name: string
          issuer: string | null
          number: string | null
          issued_at: string | null
          expires_at: string | null
          status: string | null
          required: boolean | null
          file_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id: string
          name: string
          issuer?: string | null
          number?: string | null
          issued_at?: string | null
          expires_at?: string | null
          status?: string | null
          required?: boolean | null
          file_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string
          name?: string
          issuer?: string | null
          number?: string | null
          issued_at?: string | null
          expires_at?: string | null
          status?: string | null
          required?: boolean | null
          file_path?: string | null
          created_at?: string
        }
      }
      quick_reference_pins: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          kind: string
          title: string
          subtitle: string | null
          target_type: string | null
          target_id: string | null
          target_url: string | null
          content: Json | null
          pinned_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id: string
          kind: string
          title: string
          subtitle?: string | null
          target_type?: string | null
          target_id?: string | null
          target_url?: string | null
          content?: Json | null
          pinned_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string
          kind?: string
          title?: string
          subtitle?: string | null
          target_type?: string | null
          target_id?: string | null
          target_url?: string | null
          content?: Json | null
          pinned_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          kind: string
          at: string
          title: string
          meta: Json
          target_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id: string
          kind: string
          at?: string
          title: string
          meta?: Json
          target_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string
          kind?: string
          at?: string
          title?: string
          meta?: Json
          target_id?: string | null
        }
      }
      surveys: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          status: string
          question_count: number | null
          estimated_minutes: number | null
          closes_at: string | null
          anonymous: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          description?: string | null
          status?: string
          question_count?: number | null
          estimated_minutes?: number | null
          closes_at?: string | null
          anonymous?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          description?: string | null
          status?: string
          question_count?: number | null
          estimated_minutes?: number | null
          closes_at?: string | null
          anonymous?: boolean
          created_at?: string
        }
      }
      survey_assignments: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          survey_id: string
          status: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id: string
          survey_id: string
          status?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string
          survey_id?: string
          status?: string
          completed_at?: string | null
        }
      }
      feedback_submissions: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string | null
          category: string
          message: string
          anonymous: boolean
          status: string
          submitted_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id?: string | null
          category: string
          message: string
          anonymous?: boolean
          status?: string
          submitted_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string | null
          category?: string
          message?: string
          anonymous?: boolean
          status?: string
          submitted_at?: string
        }
      }
      safe_voice_submissions: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string | null
          category: string
          message: string
          anonymous: boolean
          status: string
          submitted_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          profile_id?: string | null
          category: string
          message: string
          anonymous?: boolean
          status?: string
          submitted_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          profile_id?: string | null
          category?: string
          message?: string
          anonymous?: boolean
          status?: string
          submitted_at?: string
        }
      }
      emergency_protocols: {
        Row: {
          id: string
          tenant_id: string
          category: string
          title: string
          short_label: string
          description: string | null
          offline_available: boolean
          last_synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category: string
          title: string
          short_label: string
          description?: string | null
          offline_available?: boolean
          last_synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          category?: string
          title?: string
          short_label?: string
          description?: string | null
          offline_available?: boolean
          last_synced_at?: string
          created_at?: string
        }
      }
      emergency_protocol_steps: {
        Row: {
          id: string
          protocol_id: string
          ord: number
          title: string
          detail: string | null
          caution: string | null
        }
        Insert: {
          id?: string
          protocol_id: string
          ord?: number
          title: string
          detail?: string | null
          caution?: string | null
        }
        Update: {
          id?: string
          protocol_id?: string
          ord?: number
          title?: string
          detail?: string | null
          caution?: string | null
        }
      }
      emergency_protocol_documents: {
        Row: {
          protocol_id: string
          document_id: string
        }
        Insert: {
          protocol_id: string
          document_id: string
        }
        Update: {
          protocol_id?: string
          document_id?: string
        }
      }
      emergency_contacts: {
        Row: {
          id: string
          tenant_id: string
          label: string
          role: string | null
          phone: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          label: string
          role?: string | null
          phone: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          label?: string
          role?: string | null
          phone?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      emergency_drills: {
        Row: {
          id: string
          tenant_id: string
          title: string
          conducted_at: string | null
          outcome: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          conducted_at?: string | null
          outcome: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          conducted_at?: string | null
          outcome?: string
        }
      }
      document_versions: {
        Row: {
          id: string
          tenant_id: string
          document_id: string
          version: string
          title: string
          summary: string | null
          content: string | null
          metadata: Json
          status_at_snapshot: string | null
          author_type: string
          change_reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          document_id: string
          version: string
          title: string
          summary?: string | null
          content?: string | null
          metadata?: Json
          status_at_snapshot?: string | null
          author_type?: string
          change_reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          document_id?: string
          version?: string
          title?: string
          summary?: string | null
          content?: string | null
          metadata?: Json
          status_at_snapshot?: string | null
          author_type?: string
          change_reason?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      document_validations: {
        Row: {
          id: string
          tenant_id: string
          document_id: string
          version: string | null
          status: string
          score: number | null
          frameworks: Json
          gaps: Json
          flags: Json
          blockers: Json
          summary: string | null
          model: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          document_id: string
          version?: string | null
          status?: string
          score?: number | null
          frameworks?: Json
          gaps?: Json
          flags?: Json
          blockers?: Json
          summary?: string | null
          model?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          document_id?: string
          version?: string | null
          status?: string
          score?: number | null
          frameworks?: Json
          gaps?: Json
          flags?: Json
          blockers?: Json
          summary?: string | null
          model?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          tenant_id: string
          actor_id: string | null
          actor_role: string | null
          action: string
          target_type: string | null
          target_id: string | null
          summary: string | null
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          actor_id?: string | null
          actor_role?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          summary?: string | null
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          actor_id?: string | null
          actor_role?: string | null
          action?: string
          target_type?: string | null
          target_id?: string | null
          summary?: string | null
          meta?: Json
          created_at?: string
        }
      }
      platform_audit_log: {
        Row: {
          id: string
          actor_id: string | null
          actor_role: string | null
          action: string
          target_type: string | null
          target_id: string | null
          target_tenant_id: string | null
          summary: string | null
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_role?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          target_tenant_id?: string | null
          summary?: string | null
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          actor_role?: string | null
          action?: string
          target_type?: string | null
          target_id?: string | null
          target_tenant_id?: string | null
          summary?: string | null
          meta?: Json
          created_at?: string
        }
      }
      tenant_plans: {
        Row: {
          id: string
          label: string
          description: string | null
          max_users: number
          max_documents: number
          max_sites: number
          ai_queries_per_month: number | null
          storage_gb: number
          hitl_enabled: boolean
          golden_answers_enabled: boolean
          custom_guidance_enabled: boolean
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          label: string
          description?: string | null
          max_users?: number
          max_documents?: number
          max_sites?: number
          ai_queries_per_month?: number | null
          storage_gb?: number
          hitl_enabled?: boolean
          golden_answers_enabled?: boolean
          custom_guidance_enabled?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          description?: string | null
          max_users?: number
          max_documents?: number
          max_sites?: number
          ai_queries_per_month?: number | null
          storage_gb?: number
          hitl_enabled?: boolean
          golden_answers_enabled?: boolean
          custom_guidance_enabled?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      tenant_feature_flags: {
        Row: {
          tenant_id: string
          feature: string
          enabled: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          tenant_id: string
          feature: string
          enabled?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          feature?: string
          enabled?: boolean
          updated_by?: string | null
          updated_at?: string
        }
      }
      tenant_usage_meters: {
        Row: {
          id: string
          tenant_id: string
          period_start: string
          period_end: string
          ai_queries: number
          ai_tokens_used: number
          documents_count: number
          chunks_count: number
          storage_bytes: number
          active_users: number
          hitl_reviews: number
          incidents_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          period_start: string
          period_end: string
          ai_queries?: number
          ai_tokens_used?: number
          documents_count?: number
          chunks_count?: number
          storage_bytes?: number
          active_users?: number
          hitl_reviews?: number
          incidents_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          period_start?: string
          period_end?: string
          ai_queries?: number
          ai_tokens_used?: number
          documents_count?: number
          chunks_count?: number
          storage_bytes?: number
          active_users?: number
          hitl_reviews?: number
          incidents_count?: number
          updated_at?: string
        }
      }
      tenant_provisioning_log: {
        Row: {
          id: string
          tenant_id: string
          step: string
          status: string
          detail: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          step: string
          status?: string
          detail?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          step?: string
          status?: string
          detail?: string | null
          created_at?: string
        }
      }
      master_templates: {
        Row: {
          id: string
          document_id: string
          title: string
          description: string | null
          document_type: string
          category: string | null
          pillar: string | null
          sector: string | null
          framework: string[] | null
          tags: string[] | null
          risk_level: string | null
          status: string
          target_roles: string[]
          current_version: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          title: string
          description?: string | null
          document_type?: string
          category?: string | null
          pillar?: string | null
          sector?: string | null
          framework?: string[] | null
          tags?: string[] | null
          risk_level?: string | null
          status?: string
          target_roles?: string[]
          current_version?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          title?: string
          description?: string | null
          document_type?: string
          category?: string | null
          pillar?: string | null
          sector?: string | null
          framework?: string[] | null
          tags?: string[] | null
          risk_level?: string | null
          status?: string
          target_roles?: string[]
          current_version?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      master_template_versions: {
        Row: {
          id: string
          template_id: string
          version: string
          document_id: string
          title: string
          content: string | null
          summary: string | null
          change_reason: string | null
          propagated_to: string[]
          status: string
          published_at: string | null
          published_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          version: string
          document_id: string
          title: string
          content?: string | null
          summary?: string | null
          change_reason?: string | null
          propagated_to?: string[]
          status?: string
          published_at?: string | null
          published_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          version?: string
          document_id?: string
          title?: string
          content?: string | null
          summary?: string | null
          change_reason?: string | null
          propagated_to?: string[]
          status?: string
          published_at?: string | null
          published_by?: string | null
          created_at?: string
        }
      }
      shadow_propagation_log: {
        Row: {
          id: string
          template_id: string
          version_id: string
          target_tenant_id: string
          shadow_document_id: string | null
          status: string
          detail: string | null
          pushed_by: string | null
          pushed_at: string
        }
        Insert: {
          id?: string
          template_id: string
          version_id: string
          target_tenant_id: string
          shadow_document_id?: string | null
          status?: string
          detail?: string | null
          pushed_by?: string | null
          pushed_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          version_id?: string
          target_tenant_id?: string
          shadow_document_id?: string | null
          status?: string
          detail?: string | null
          pushed_by?: string | null
          pushed_at?: string
        }
      }
      ai_models: {
        Row: {
          id: string
          provider: string
          model_id: string
          label: string
          model_type: string
          context_window: number | null
          max_output_tokens: number | null
          cost_per_1k_input: number | null
          cost_per_1k_output: number | null
          is_active: boolean
          is_default: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider?: string
          model_id: string
          label: string
          model_type?: string
          context_window?: number | null
          max_output_tokens?: number | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          is_active?: boolean
          is_default?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          model_id?: string
          label?: string
          model_type?: string
          context_window?: number | null
          max_output_tokens?: number | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          is_active?: boolean
          is_default?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      ai_prompts: {
        Row: {
          id: string
          key: string
          label: string
          description: string | null
          prompt_type: string
          model_type: string
          is_active: boolean
          current_version_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          label: string
          description?: string | null
          prompt_type?: string
          model_type?: string
          is_active?: boolean
          current_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
          description?: string | null
          prompt_type?: string
          model_type?: string
          is_active?: boolean
          current_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_prompt_versions: {
        Row: {
          id: string
          prompt_id: string
          version: string
          content: string
          change_reason: string | null
          status: string
          published_at: string | null
          published_by: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          version: string
          content: string
          change_reason?: string | null
          status?: string
          published_at?: string | null
          published_by?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          version?: string
          content?: string
          change_reason?: string | null
          status?: string
          published_at?: string | null
          published_by?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      ai_evaluations: {
        Row: {
          id: string
          label: string
          description: string | null
          prompt_id: string | null
          prompt_version_id: string | null
          model_id: string | null
          status: string
          avg_score: number | null
          avg_latency_ms: number | null
          total_cases: number
          passed_cases: number
          summary: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          label: string
          description?: string | null
          prompt_id?: string | null
          prompt_version_id?: string | null
          model_id?: string | null
          status?: string
          avg_score?: number | null
          avg_latency_ms?: number | null
          total_cases?: number
          passed_cases?: number
          summary?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          label?: string
          description?: string | null
          prompt_id?: string | null
          prompt_version_id?: string | null
          model_id?: string | null
          status?: string
          avg_score?: number | null
          avg_latency_ms?: number | null
          total_cases?: number
          passed_cases?: number
          summary?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      ai_evaluation_cases: {
        Row: {
          id: string
          evaluation_id: string
          input: string
          expected_output: string | null
          actual_output: string | null
          score: number | null
          latency_ms: number | null
          status: string
          notes: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          input: string
          expected_output?: string | null
          actual_output?: string | null
          score?: number | null
          latency_ms?: number | null
          status?: string
          notes?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          input?: string
          expected_output?: string | null
          actual_output?: string | null
          score?: number | null
          latency_ms?: number | null
          status?: string
          notes?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      hitl_sla_config: {
        Row: {
          id: string
          risk_level: string
          sla_hours: number
          escalation_hours: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          risk_level: string
          sla_hours: number
          escalation_hours?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          risk_level?: string
          sla_hours?: number
          escalation_hours?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      platform_tenant_overview: {
        Row: {
          id: string
          name: string
          industry: string | null
          country: string
          state_or_territory: string | null
          status: string
          plan: string
          is_platform: boolean
          created_at: string
          updated_at: string
          user_count: number
          document_count: number
          site_count: number
        }
      }
      staff_compliance_items: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          kind: string
          title: string
          state: string
          due_at: string | null
          completed_at: string | null
          linked_document_id: string | null
          linked_training_id: string | null
          progress_percent: number | null
        }
      }
      master_template_summary: {
        Row: {
          id: string
          document_id: string
          title: string
          description: string | null
          document_type: string
          category: string | null
          pillar: string | null
          sector: string | null
          framework: string[] | null
          tags: string[] | null
          risk_level: string | null
          status: string
          target_roles: string[]
          current_version: string | null
          created_at: string
          updated_at: string
          shadow_count: number
          version_count: number
          latest_version: string | null
        }
      }
      ai_model_summary: {
        Row: {
          id: string
          provider: string
          model_id: string
          label: string
          model_type: string
          context_window: number | null
          max_output_tokens: number | null
          cost_per_1k_input: number | null
          cost_per_1k_output: number | null
          is_active: boolean
          is_default: boolean
          metadata: Json
          created_at: string
          updated_at: string
          model_type_label: string
        }
      }
      ai_prompt_summary: {
        Row: {
          id: string
          key: string
          label: string
          description: string | null
          prompt_type: string
          model_type: string
          is_active: boolean
          current_version_id: string | null
          created_at: string
          updated_at: string
          current_version: string | null
          version_count: number
          evaluation_count: number
        }
      }
      platform_hitl_overview: {
        Row: {
          id: string
          tenant_id: string
          tenant_name: string
          user_id: string | null
          user_email: string | null
          user_name: string | null
          query: string
          draft_answer: string | null
          confidence: number | null
          risk_level: string | null
          status: string
          reviewer_id: string | null
          reviewed_answer: string | null
          review_notes: string | null
          created_at: string
          reviewed_at: string | null
          age_hours: number
          sla_breached: boolean
        }
      }
    }
    Functions: {
      match_tenant_documents: {
        Args: {
          query_embedding: unknown
          input_tenant_id: string
          match_count?: number
          input_user_role?: string
          input_site_id?: string
          filter?: Json
          min_similarity?: number
        }
        Returns: {
          chunk_id: string
          document_id: string
          tenant_id: string
          content: string
          title: string
          document_type: string
          version: string
          section_title: string | null
          section_number: string | null
          metadata: Json
          similarity: number
        }[]
      }
      current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      provision_tenant: {
        Args: {
          p_name: string
          p_industry?: string | null
          p_country?: string
          p_state_or_territory?: string | null
          p_plan?: string
          p_default_site_name?: string
          p_default_site_code?: string
        }
        Returns: string
      }
      propagate_shadow: {
        Args: {
          p_version_id: string
          p_target_tenant_ids?: string[] | null
        }
        Returns: {
          tenant_id: string
          shadow_document_id: string
          status: string
          detail: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
