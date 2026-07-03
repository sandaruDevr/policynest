import fs from 'fs'
import os from 'os'
import path from 'path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { z } from 'zod'
import multer from 'multer'
import { config, validateConfig } from './config.js'
import { processDocument } from './documentProcessor.js'
import { validateDocument } from './documentValidator.js'
import { processRAGQuery } from './ragService.js'
import { extractTextFromFile } from './documentExtractor.js'
import { supabase } from './supabase.js'
import {
  structuredLogger,
  generalLimiter,
  strictLimiter,
  asyncHandler,
  globalErrorHandler,
  validateBody,
} from './middleware.js'

// Multer in-memory upload (no disk storage; file discarded after extraction)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

// Fail fast if required configuration is missing.
validateConfig()

const app = express()

// Security headers
app.use(helmet())

// CORS hardening: only allow configured origins.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
  }),
)

app.use(express.json({ limit: '10mb' }))
app.use(structuredLogger)

// Internal auth middleware
function internalAuth(req, res, next) {
  const token = req.headers['x-internal-token']
  if (!token || token !== config.internalSharedSecret) {
    const err = new Error('Unauthorized')
    err.status = 401
    err.expose = true
    return next(err)
  }
  next()
}

// Rate limiters
app.use(generalLimiter)
app.use('/api/rag/query', strictLimiter)

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ------------------------------------------------------------------
// Zod schemas
// ------------------------------------------------------------------

const processDocSchema = z.object({
  document_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  text: z.string().min(1),
  options: z.record(z.unknown()).optional(),
})

const validateDocSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  document_type: z.string().optional(),
  frameworks: z.array(z.string()).optional(),
  sector: z.string().optional(),
  risk_level: z.string().optional(),
})

const ragQuerySchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  role: z.string().optional(),
  staff_role: z.string().nullable().optional(),
  site_id: z.string().uuid().nullable().optional(),
  query: z.string().min(1).max(2000),
  mode: z.string().optional(),
  voice: z.boolean().optional(),
  context_hints: z.array(z.string()).optional(),
  document_context: z.string().optional(),
  conversation_history: z
    .array(
      z.object({
        query: z.string(),
        answer: z.string().nullable().optional(),
      }),
    )
    .max(20)
    .optional(),
})

const incidentSchema = z.object({
  tenant_id: z.string().uuid(),
  submitted_by: z.string().uuid().optional(),
  incident_type: z.string().min(1).max(120),
  description: z.string().min(1).max(5000),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

const goldenAnswerSchema = z.object({
  tenant_id: z.string().uuid(),
  question_pattern: z.string().min(1).max(500),
  approved_answer: z.string().min(1).max(8000),
  citations: z.array(z.string().max(500)).max(20).optional(),
  framework: z.array(z.string()).optional(),
  risk_level: z.string().max(40).optional(),
  approved_by: z.string().uuid().optional(),
})

const onboardingSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().max(200).optional(),
  org_name: z.string().min(1).max(200),
  industry: z.string().min(1).max(120),
  role: z.string().max(60).optional(),
})

const createTestUserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(200).optional(),
  role: z.string().max(60).optional(),
  tenant_id: z.string().uuid(),
})

const adminCreateUserSchema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().max(200).optional(),
  role: z.string().max(60).optional(),
  staff_role: z.string().max(60).optional(),
  site_id: z.string().uuid().nullable().optional(),
  job_title: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
})

const hitlApproveSchema = z.object({
  reviewer_id: z.string().uuid(),
  reviewed_answer: z.string().min(1).optional(),
  save_as_golden: z.boolean().optional(),
})

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

app.post(
  '/api/documents/process',
  internalAuth,
  validateBody(processDocSchema),
  asyncHandler(async (req, res) => {
    const { document_id, tenant_id, text, options } = req.validated
    const result = await processDocument(document_id, tenant_id, text, options)
    res.json({
      success: result.success,
      chunks: result.chunks,
      structured: result.structured,
      structuredContent: result.structuredContent,
      summary: result.summary,
      suggestedTitle: result.suggestedTitle,
      suggestedCategory: result.suggestedCategory,
      suggestedRiskLevel: result.suggestedRiskLevel,
      suggestedTags: result.suggestedTags,
      suggestedSector: result.suggestedSector,
    })
  }),
)

app.post(
  '/api/documents/extract',
  internalAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file
    if (!file) {
      const err = new Error('No file uploaded')
      err.status = 400
      err.expose = true
      throw err
    }

    const mimetype = file.mimetype
    const safeName = path.basename(file.originalname).replace(/[^\w.\-]/g, '_')
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${safeName}`)

    try {
      await fs.promises.writeFile(tempPath, file.buffer)

      const text = await extractTextFromFile(tempPath, mimetype)
      await fs.promises.unlink(tempPath)

      res.json({
        text,
        filename: file.originalname,
        size: file.size,
        mimetype,
      })
    } catch (err) {
      // Clean up temp file if it exists
      try { await fs.promises.unlink(tempPath) } catch {}
      throw err
    }
  }),
)

app.post(
  '/api/documents/validate',
  internalAuth,
  validateBody(validateDocSchema),
  asyncHandler(async (req, res) => {
    const { title, content, document_type, frameworks, sector, risk_level } = req.validated
    const result = await validateDocument({
      title,
      content,
      documentType: document_type,
      frameworks,
      sector,
      riskLevel: risk_level,
    })
    res.json(result)
  }),
)

app.post(
  '/api/rag/query',
  internalAuth,
  validateBody(ragQuerySchema),
  asyncHandler(async (req, res) => {
    const {
      user_id,
      tenant_id,
      role,
      staff_role,
      site_id,
      query,
      mode,
      voice,
      context_hints,
      document_context,
      conversation_history,
    } = req.validated
    const result = await processRAGQuery(
      user_id,
      tenant_id,
      role,
      staff_role,
      site_id,
      query,
      {
        mode,
        voice,
        contextHints: context_hints,
        documentContext: document_context,
        conversationHistory: conversation_history,
      },
    )
    res.json(result)
  }),
)

app.post(
  '/api/incidents',
  internalAuth,
  validateBody(incidentSchema),
  asyncHandler(async (req, res) => {
    const { tenant_id, submitted_by, incident_type, description, urgency } = req.validated

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        tenant_id,
        submitted_by,
        incident_type,
        description,
        urgency: urgency || 'medium',
        status: 'submitted',
      })
      .select()
      .single()

    if (error) throw error

    // AI next-steps suggestion is best-effort: never block incident creation.
    try {
      const ragResult = await processRAGQuery(
        submitted_by || null,
        tenant_id,
        'staff',
        null,
        null,
        `What are the next steps for ${incident_type}? ${description}`,
      )

      if (ragResult && !ragResult.requires_escalation && ragResult.answer) {
        await supabase
          .from('incidents')
          .update({ ai_suggested_next_steps: ragResult.answer })
          .eq('id', data.id)
        data.ai_suggested_next_steps = ragResult.answer
      }
    } catch (ragError) {
      console.error('[incidents] AI suggestion failed (non-fatal):', ragError.message)
    }

    res.json(data)
  }),
)

app.post(
  '/api/golden-answers',
  internalAuth,
  validateBody(goldenAnswerSchema),
  asyncHandler(async (req, res) => {
    const { tenant_id, question_pattern, approved_answer, citations, framework, risk_level, approved_by } = req.validated

    const { data, error } = await supabase
      .from('golden_answers')
      .insert({
        tenant_id,
        question_pattern,
        approved_answer,
        citations: citations || [],
        framework: framework || [],
        risk_level,
        approved_by,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  }),
)

app.post(
  '/api/onboarding/setup',
  internalAuth,
  validateBody(onboardingSchema),
  asyncHandler(async (req, res) => {
    const { user_id, full_name, org_name, industry, role } = req.validated

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: org_name, industry, country: 'Australia' })
      .select()
      .single()

    if (tenantError) throw tenantError

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user_id,
      tenant_id: tenant.id,
      full_name,
      role: role || 'organisation_admin',
    })

    if (profileError) throw profileError

    res.json({
      success: true,
      tenant_id: tenant.id,
      redirect: role === 'organisation_admin' ? '/admin' : '/staff',
    })
  }),
)

app.post(
  '/api/auth/create-test-user',
  internalAuth,
  validateBody(createTestUserSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name, role, tenant_id } = req.validated

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.json({ success: true, message: 'User already exists' })
      }
      throw authError
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.user.id,
      tenant_id,
      full_name: name,
      role,
    })

    if (profileError) throw profileError

    res.json({ success: true, userId: authUser.user.id })
  }),
)

app.post(
  '/api/admin/users/create',
  internalAuth,
  validateBody(adminCreateUserSchema),
  asyncHandler(async (req, res) => {
    const { tenant_id, email, full_name, role, staff_role, site_id, job_title, phone } = req.validated

    const tempPassword = `Cs-${Math.random().toString(36).slice(2, 10)}${Math.floor(1000 + Math.random() * 9000)}!`

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        const err = new Error('A user with this email already exists')
        err.status = 409
        err.expose = true
        throw err
      }
      throw authError
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.user.id,
      tenant_id,
      full_name: full_name || null,
      email,
      role: role || 'staff',
      staff_role: staff_role || null,
      site_id: site_id || null,
      job_title: job_title || null,
      phone: phone || null,
      status: 'invited',
    })

    if (profileError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw profileError
    }

    res.json({ success: true, userId: authUser.user.id, tempPassword })
  }),
)

app.post(
  '/api/hitl/:id/approve',
  internalAuth,
  validateBody(hitlApproveSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { reviewer_id, reviewed_answer, save_as_golden } = req.validated

    const { data, error } = await supabase
      .from('hitl_queue')
      .update({
        status: 'approved',
        reviewer_id,
        reviewed_answer,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (save_as_golden && reviewed_answer) {
      await supabase.from('golden_answers').insert({
        tenant_id: data.tenant_id,
        question_pattern: data.query,
        approved_answer: reviewed_answer,
        citations: data.retrieved_chunks,
        approved_by: reviewer_id,
        status: 'active',
      })
    }

    res.json(data)
  }),
)

// Global error handler
app.use(globalErrorHandler)

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`CareSuite AI server running on port ${config.port} (${config.env})`)
})
