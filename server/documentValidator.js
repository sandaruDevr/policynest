import { generateChatCompletion } from './openai.js'

/**
 * AI compliance validation for a tenant document.
 *
 * Produces a structured, governance-safe assessment: framework coverage,
 * detected gaps, drift/outdated flags, publish blockers, and an overall
 * status. Designed to be stored in `document_validations` and surfaced in the
 * Org Admin governance workspace.
 *
 * Returns a normalized shape regardless of model variance.
 */
export async function validateDocument({ title, content, documentType, frameworks = [], sector, riskLevel }) {
  if (!content || content.trim().length === 0) {
    throw new Error('Document content is empty')
  }

  const frameworkList = Array.isArray(frameworks) && frameworks.length > 0
    ? frameworks.join(', ')
    : 'Australian aged care / NDIS compliance frameworks'

  const system = `You are a compliance governance assistant for an Australian care provider.
You assess operational policy and procedure documents for regulatory completeness.
You DO NOT invent obligations. You only flag genuine, well-established gaps.
Respond ONLY as strict JSON matching the requested schema.`

  const user = `Assess the following ${documentType || 'document'} against these frameworks: ${frameworkList}.
Sector: ${sector || 'unspecified'}. Risk level: ${riskLevel || 'unspecified'}.

TITLE: ${title || 'Untitled'}

CONTENT:
"""
${content.slice(0, 12000)}
"""

Return JSON with this exact schema:
{
  "status": "pass" | "warn" | "fail",
  "score": number (0-100),
  "summary": string (2-3 sentences),
  "frameworks": [{ "framework": string, "coverage": number (0-100), "status": "pass"|"warn"|"fail" }],
  "gaps": [{ "title": string, "severity": "low"|"medium"|"high"|"critical", "detail": string }],
  "flags": [{ "type": "drift"|"outdated"|"ambiguous"|"missing-control", "detail": string }],
  "blockers": [string]
}
Rules:
- "blockers" must list ONLY critical issues that should prevent publishing.
- If the document is sound, return empty gaps/flags/blockers and status "pass".`

  const raw = await generateChatCompletion([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ])

  return normalize(raw)
}

function normalize(raw) {
  const allowedStatus = ['pass', 'warn', 'fail']
  const status = allowedStatus.includes(raw?.status) ? raw.status : 'warn'
  const score = typeof raw?.score === 'number' ? Math.max(0, Math.min(100, raw.score)) : null

  const frameworks = Array.isArray(raw?.frameworks)
    ? raw.frameworks.map((f) => ({
        framework: String(f.framework || 'Framework'),
        coverage: typeof f.coverage === 'number' ? Math.max(0, Math.min(100, f.coverage)) : 0,
        status: allowedStatus.includes(f.status) ? f.status : 'warn',
      }))
    : []

  const gaps = Array.isArray(raw?.gaps)
    ? raw.gaps.map((g) => ({
        title: String(g.title || 'Gap'),
        severity: ['low', 'medium', 'high', 'critical'].includes(g.severity) ? g.severity : 'medium',
        detail: String(g.detail || ''),
      }))
    : []

  const flags = Array.isArray(raw?.flags)
    ? raw.flags.map((f) => ({
        type: ['drift', 'outdated', 'ambiguous', 'missing-control'].includes(f.type) ? f.type : 'ambiguous',
        detail: String(f.detail || ''),
      }))
    : []

  const blockers = Array.isArray(raw?.blockers) ? raw.blockers.map(String) : []
  const summary = typeof raw?.summary === 'string' ? raw.summary : ''

  return { status, score, summary, frameworks, gaps, flags, blockers }
}
