-- =====================================================================
-- Phase 14: Platform AI Governance
-- ---------------------------------------------------------------------
-- Adds:
--   1. ai_models — registry of LLM/embedding models available to the platform
--   2. ai_prompts — registry of system prompts (RAG, structuring, validation)
--   3. ai_prompt_versions — versioned prompt content with change tracking
--   4. ai_evaluations — evaluation runs comparing prompt/model combinations
--   5. ai_evaluation_cases — individual test cases within an evaluation
--   6. Platform RLS on all tables
--   7. ai_model_summary + ai_prompt_summary views for directory
--
-- Idempotent. Run AFTER phase13_master_templates.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ai_models — registry of available AI models
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'openai',       -- 'openai', 'anthropic', 'azure', etc.
  model_id text NOT NULL,                         -- e.g. 'gpt-5.4-mini', 'text-embedding-3-large'
  label text NOT NULL,                            -- human-friendly name
  model_type text NOT NULL DEFAULT 'chat'
    CHECK (model_type IN ('chat', 'embedding', 'vision', 'reasoning')),
  context_window integer,                         -- max tokens in
  max_output_tokens integer,                      -- max tokens out
  cost_per_1k_input numeric,                      -- USD per 1K input tokens
  cost_per_1k_output numeric,                     -- USD per 1K output tokens
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,      -- one default per model_type
  metadata jsonb NOT NULL DEFAULT '{}',           -- extra config (temperature, top_p, etc.)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, model_id)
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage AI models" ON ai_models;
CREATE POLICY "Platform admins can manage AI models"
ON ai_models
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- Seed current models from env config
INSERT INTO ai_models (provider, model_id, label, model_type, is_default, metadata)
VALUES
  ('openai', 'gpt-5.4-mini', 'GPT-5.4 Mini', 'chat', true, '{"temperature": 0.3}'),
  ('openai', 'text-embedding-3-large', 'Text Embedding 3 Large', 'embedding', true, '{"dimensions": 3072}')
ON CONFLICT (provider, model_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. ai_prompts — registry of system prompts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,                       -- 'rag_system', 'doc_structure', 'doc_validate'
  label text NOT NULL,
  description text,
  prompt_type text NOT NULL DEFAULT 'system'
    CHECK (prompt_type IN ('system', 'user_template', 'structured')),
  model_type text NOT NULL DEFAULT 'chat',         -- which model type this prompt targets
  is_active boolean NOT NULL DEFAULT true,
  current_version_id uuid,                         -- FK set below after versions table
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage AI prompts" ON ai_prompts;
CREATE POLICY "Platform admins can manage AI prompts"
ON ai_prompts
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- ---------------------------------------------------------------------
-- 3. ai_prompt_versions — versioned prompt content
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES ai_prompts(id) ON DELETE CASCADE,
  version text NOT NULL,                          -- 'v1.0', 'v1.1', etc.
  content text NOT NULL,                          -- the actual prompt text
  change_reason text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'superseded')),
  published_at timestamptz,
  published_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version)
);

ALTER TABLE ai_prompt_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage prompt versions" ON ai_prompt_versions;
CREATE POLICY "Platform admins can manage prompt versions"
ON ai_prompt_versions
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- Now add the FK from ai_prompts.current_version_id to ai_prompt_versions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ai_prompts_current_version_fkey'
  ) THEN
    ALTER TABLE ai_prompts
      ADD CONSTRAINT ai_prompts_current_version_fkey
      FOREIGN KEY (current_version_id) REFERENCES ai_prompt_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ai_prompt_versions_prompt_idx
  ON ai_prompt_versions(prompt_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 4. ai_evaluations — evaluation runs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  prompt_id uuid REFERENCES ai_prompts(id) ON DELETE SET NULL,
  prompt_version_id uuid REFERENCES ai_prompt_versions(id) ON DELETE SET NULL,
  model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  -- Aggregate metrics computed when evaluation completes
  avg_score numeric,
  avg_latency_ms integer,
  total_cases integer NOT NULL DEFAULT 0,
  passed_cases integer NOT NULL DEFAULT 0,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage evaluations" ON ai_evaluations;
CREATE POLICY "Platform admins can manage evaluations"
ON ai_evaluations
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS ai_evaluations_status_idx
  ON ai_evaluations(status, created_at DESC);

-- ---------------------------------------------------------------------
-- 5. ai_evaluation_cases — individual test cases
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_evaluation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
  input text NOT NULL,                            -- the query/input
  expected_output text,                           -- expected response (for comparison)
  actual_output text,                             -- actual model response
  score numeric,                                  -- 0-1 similarity/quality score
  latency_ms integer,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'pass', 'fail', 'error')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_evaluation_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage eval cases" ON ai_evaluation_cases;
CREATE POLICY "Platform admins can manage eval cases"
ON ai_evaluation_cases
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS ai_eval_cases_evaluation_idx
  ON ai_evaluation_cases(evaluation_id);

-- ---------------------------------------------------------------------
-- 6. Views for directory
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW ai_model_summary
WITH (security_invoker = on) AS
SELECT
  m.*,
  CASE
    WHEN m.model_type = 'chat' THEN 'Chat'
    WHEN m.model_type = 'embedding' THEN 'Embedding'
    WHEN m.model_type = 'vision' THEN 'Vision'
    WHEN m.model_type = 'reasoning' THEN 'Reasoning'
  END AS model_type_label
FROM ai_models m;

CREATE OR REPLACE VIEW ai_prompt_summary
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.key,
  p.label,
  p.description,
  p.prompt_type,
  p.model_type,
  p.is_active,
  p.current_version_id,
  p.created_at,
  p.updated_at,
  (SELECT pv.version FROM ai_prompt_versions pv
   WHERE pv.id = p.current_version_id) AS current_version,
  (SELECT count(*) FROM ai_prompt_versions pv
   WHERE pv.prompt_id = p.id) AS version_count,
  (SELECT count(*) FROM ai_evaluations e
   WHERE e.prompt_id = p.id) AS evaluation_count
FROM ai_prompts p;
