import { generateEmbedding, generateChatCompletion } from './openai.js'
import { supabase } from './supabase.js'
import { config } from './config.js'
import { shouldEscalate, detectHighRiskScenario, checkIncidentType } from './rulesEngine.js'

const SYSTEM_PROMPT = `You are CareSuite AI, a strict policy intelligence assistant for Australian care providers.

Your job is to answer user questions using ONLY the retrieved approved policy context.

CORE RULES:
- Use only retrieved context as source of truth.
- Do not invent policies, legal duties, reporting deadlines, clinical steps, forms, or escalation pathways.
- If context is missing, unrelated, expired, contradictory, or insufficient, set "policy_not_found" to true.
- If policy_not_found is true, answer must be exactly: "Policy not found. Please escalate to your supervisor."

ROLE-SAFE GUIDANCE:
- Respect the user's role and scope of practice.
- For care workers/support workers, avoid clinical assessment, diagnosis, or treatment wording.
- Use: "observe and report visible concerns", "notify the Registered Nurse or supervisor", "follow clinical staff direction".
- Avoid: "assess injuries", "check vital signs", "determine clinical status".

HIGH-RISK ESCALATION:
- Set "requires_escalation" to true for falls, injuries, medication errors, abuse, neglect, restrictive practice, unconsciousness, choking, bleeding, severe symptoms, emergencies.
- Provide immediate safe steps only if supported by context.
- Recommend notifying the RN, supervisor, or Clinical Manager.

ANSWER STYLE:
- Practical, clear, concise. First sentence directly answers the question.
- Use numbered step-by-step guidance when applicable.
- Include who to notify, what to document, what not to do.
- Do not provide clinical diagnosis or treatment advice beyond policy.

CITATION RULES:
- Every important instruction must be supported by a citation.
- Use exact document title, version, and section_title from retrieved context.
- The "citations" array must contain unique citations only.

CONFIDENCE RULES:
- confidence: 0.0 to 1.0.
- 0.90-1.00 = direct clear answer from context.
- 0.75-0.89 = supported but requires synthesis.
- < 0.75 = weak, partial, ambiguous, or missing.
- If confidence < 0.85, set requires_escalation to true.
- If confidence < 0.70, set policy_not_found to true.

STEPS ARRAY — CRITICAL:
- When the answer contains sequential instructions, you MUST populate the "steps" array.
- Each step object must have: "step" (text), "citation" (object with title, version, section_title).
- Do NOT put numbered steps only inside "answer". Put them in "steps".
- The "answer" field should be a short introductory summary (1-2 sentences), NOT a long text with embedded steps.

SUGGESTED ACTIONS:
- Populate "suggested_actions" array with relevant actions:
  - { "type": "open_document", "document_id": "doc_id", "section_anchor": "section_name" } — for the most relevant citation.
  - { "type": "start_incident", "preset_type": "fall|medication|abuse|aggression|missing|infection|choking|other" } — if high-risk scenario.
  - { "type": "rephrase" } — always include.
  - { "type": "pin_quick_ref" } — always include.

FOLLOW-UP QUESTIONS:
- Populate "follow_up_questions" with 2-3 relevant follow-up questions the user might ask next.

OUTPUT RULES:
- Return STRICT valid JSON only. No markdown. No text outside JSON. No trailing commas.
- The JSON must match this exact structure:

{
  "answer": "Short summary answer (1-2 sentences). NOT a long text.",
  "steps": [
    {
      "step": "Step description text",
      "citation": {
        "title": "Document title",
        "version": "1.0",
        "section_title": "Section title"
      }
    }
  ],
  "citations": [
    {
      "title": "Document title",
      "version": "1.0",
      "section_title": "Section title"
    }
  ],
  "confidence": 0.85,
  "requires_escalation": false,
  "policy_not_found": false,
  "forms_required": [],
  "notifications_required": [],
  "suggested_actions": [
    { "type": "open_document", "document_id": "doc_falls_prev", "section_anchor": "post-fall" },
    { "type": "rephrase" },
    { "type": "pin_quick_ref" }
  ],
  "follow_up_questions": ["What if the resident refuses assessment?", "Who do I notify first?"]
}`

const DEFAULT_AI_SETTINGS = {
  assistant_enabled: true,
  hitl_confidence_threshold: 0.85,
  escalate_high_risk: true,
  golden_answers_enabled: true,
  min_retrieval_similarity: 0.2,
  retrieval_top_k: 8,
  custom_guidance: null,
}

export async function getTenantAiSettings(tenantId) {
  try {
    const { data, error } = await supabase
      .from('tenant_ai_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (error || !data) return { ...DEFAULT_AI_SETTINGS }
    return {
      assistant_enabled: data.assistant_enabled ?? true,
      hitl_confidence_threshold: Number(data.hitl_confidence_threshold ?? 0.85),
      escalate_high_risk: data.escalate_high_risk ?? true,
      golden_answers_enabled: data.golden_answers_enabled ?? true,
      min_retrieval_similarity: Number(data.min_retrieval_similarity ?? 0.2),
      retrieval_top_k: data.retrieval_top_k ?? 8,
      custom_guidance: data.custom_guidance ?? null,
    }
  } catch (error) {
    console.error('Error loading tenant AI settings:', error)
    return { ...DEFAULT_AI_SETTINGS }
  }
}

export async function searchGoldenAnswers(tenantId, query) {
  try {
    const { data, error } = await supabase
      .from('golden_answers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error

    const queryLower = query.toLowerCase().trim()

    // Strict matching: require ≥70% of meaningful pattern words to be in query
    for (const answer of data || []) {
      const pattern = answer.question_pattern.toLowerCase().trim()

      // Exact substring match
      if (queryLower === pattern || queryLower.includes(pattern)) {
        return answer
      }

      const patternWords = pattern.split(/\s+/).filter(w => w.length > 3)
      if (patternWords.length === 0) continue

      const matchCount = patternWords.filter(word => queryLower.includes(word)).length
      const matchRatio = matchCount / patternWords.length

      if (matchRatio >= 0.7) {
        return answer
      }
    }

    return null
  } catch (error) {
    console.error('Error searching golden answers:', error)
    return null
  }
}

export async function processRAGQuery(userId, tenantId, role, staffRole, siteId, query, options = {}) {
  try {
    console.log(`[RAG] Query: "${query}" (role: ${role}, staffRole: ${staffRole})`)

    // Step 0: Load tenant AI configuration
    const aiSettings = await getTenantAiSettings(tenantId)

    if (!aiSettings.assistant_enabled) {
      console.log('[RAG] Assistant disabled for tenant')
      return {
        answer: 'The AI assistant is currently disabled for your organization. Please contact your administrator.',
        citations: [],
        confidence: 0,
        requires_escalation: false,
        escalation_reason: null,
        policy_not_found: false,
        steps: [],
        forms_required: [],
        notifications_required: [],
        suggested_actions: [],
        follow_up_questions: [],
        source: 'disabled',
      }
    }

    // Step 1: Search golden answers first (if enabled)
    const goldenAnswer = aiSettings.golden_answers_enabled
      ? await searchGoldenAnswers(tenantId, query)
      : null
    if (goldenAnswer) {
      console.log(`[RAG] Golden answer matched: "${goldenAnswer.question_pattern}"`)
      await saveAuditLog(tenantId, userId, query, goldenAnswer.approved_answer, [], goldenAnswer.citations, 1.0, false)
      return {
        answer: goldenAnswer.approved_answer,
        citations: goldenAnswer.citations,
        confidence: 1.0,
        requires_escalation: false,
        escalation_reason: null,
        policy_not_found: false,
        steps: [],
        forms_required: [],
        notifications_required: [],
        suggested_actions: [],
        follow_up_questions: [],
        source: 'golden_answer',
      }
    }

    // Step 2: Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Step 3: Search for matching documents (lower threshold - let LLM decide relevance)
    const { data: matches, error: searchError } = await supabase.rpc('match_tenant_documents', {
      query_embedding: queryEmbedding,
      input_tenant_id: tenantId,
      match_count: aiSettings.retrieval_top_k,
      input_user_role: role,
      input_site_id: siteId,
      min_similarity: aiSettings.min_retrieval_similarity,
    })

    if (searchError) {
      console.error('[RAG] Vector search error:', searchError)
      throw searchError
    }

    console.log(`[RAG] Retrieved ${matches?.length || 0} chunks`)

    // Step 4: Check if we have any relevant chunks
    if (!matches || matches.length === 0) {
      console.log('[RAG] No chunks found, escalating')
      await saveAuditLog(tenantId, userId, query, null, [], [], 0, true)
      await saveToHITLQueue(tenantId, userId, query, null, [], 0, 'high')
      return {
        answer: 'Policy not found. Please escalate to your supervisor.',
        citations: [],
        confidence: 0,
        requires_escalation: true,
        escalation_reason: 'No relevant policy documents found',
        policy_not_found: true,
        steps: [],
        forms_required: [],
        notifications_required: [],
        suggested_actions: [],
        follow_up_questions: [],
        source: 'escalation',
      }
    }

    // Log similarity scores for debugging
    console.log(`[RAG] Top similarities: ${matches.slice(0, 3).map(m => m.similarity?.toFixed(3)).join(', ')}`)

    // Step 5: Build context from retrieved chunks
    const context = matches.map((m, i) =>
      `[Source ${i + 1}: ${m.title} v${m.version} - ${m.section_title || 'General'}]\n${m.content}`
    ).join('\n\n---\n\n')

    // Step 6: Build messages with optional conversation history for multi-turn
    const systemContent = aiSettings.custom_guidance
      ? `${SYSTEM_PROMPT}

TENANT-SPECIFIC GUIDANCE:
${aiSettings.custom_guidance}`
      : SYSTEM_PROMPT
    const messages = [{ role: 'system', content: systemContent }]

    if (options.conversationHistory && options.conversationHistory.length > 0) {
      for (const turn of options.conversationHistory) {
        messages.push({ role: 'user', content: turn.query })
        if (turn.answer) {
          messages.push({ role: 'assistant', content: turn.answer })
        }
      }
    }

    const userMessage = `User role: ${role}
Staff role: ${staffRole || role}
User question: ${query}

Retrieved policy context:
${context}`

    messages.push({ role: 'user', content: userMessage })

    const llmResponse = await generateChatCompletion(messages)

    console.log(`[RAG] LLM confidence: ${llmResponse.confidence}, policy_not_found: ${llmResponse.policy_not_found}`)

    // Step 7: Validate response
    const confidence = typeof llmResponse.confidence === 'number' ? llmResponse.confidence : 0.7
    const isHighRisk = detectHighRiskScenario(query)
    const policyNotFound = llmResponse.policy_not_found === true

    // Only escalate if LLM explicitly says policy not found, or it's truly high-risk
    if (policyNotFound) {
      console.log('[RAG] LLM marked as policy_not_found')
      await saveAuditLog(tenantId, userId, query, llmResponse.answer, matches, [], confidence, true)
      await saveToHITLQueue(tenantId, userId, query, llmResponse.answer, matches, confidence, 'medium')
      return {
        answer: 'Policy not found. Please escalate to your supervisor.',
        citations: [],
        confidence: confidence,
        requires_escalation: true,
        escalation_reason: 'LLM marked policy as not found',
        policy_not_found: true,
        steps: [],
        forms_required: [],
        notifications_required: [],
        suggested_actions: [],
        follow_up_questions: [],
        source: 'escalation',
      }
    }

    const requiresEscalation =
      llmResponse.requires_escalation === true ||
      confidence < aiSettings.hitl_confidence_threshold ||
      (aiSettings.escalate_high_risk && isHighRisk)

    // Step 8: Post-process LLM response
    let steps = llmResponse.steps || []
    let citations = llmResponse.citations || []
    let suggestedActions = llmResponse.suggested_actions || []
    let followUpQuestions = llmResponse.follow_up_questions || []

    // Build a map of title+section → document_id from retrieved chunks
    const docIdMap = new Map()
    for (const m of matches) {
      const key = `${m.title}::${m.section_title || 'General'}`
      docIdMap.set(key, m.document_id || m.id)
      // Also map by title alone
      if (!docIdMap.has(m.title)) docIdMap.set(m.title, m.document_id || m.id)
    }

    // Enrich citations with document_id
    citations = citations.map((c) => ({
      ...c,
      document_id: docIdMap.get(`${c.title}::${c.section_title || 'General'}`) || docIdMap.get(c.title) || null,
      chunk_id: c.chunk_id || null,
    }))

    // If steps are empty but answer has numbered steps, extract them
    if (steps.length === 0 && llmResponse.answer) {
      const extracted = extractStepsFromText(llmResponse.answer)
      if (extracted.length > 0) {
        steps = extracted.map((text, i) => ({
          step: text,
          citation: citations[0] || { title: 'Policy document', version: '1.0', section_title: 'General' },
        }))
      }
    }

    // Generate suggested_actions if empty
    if (suggestedActions.length === 0) {
      if (citations.length > 0 && citations[0].document_id) {
        suggestedActions.push({
          type: 'open_document',
          document_id: citations[0].document_id,
          section_anchor: citations[0].section_title?.toLowerCase().replace(/\s+/g, '-'),
        })
      }
      if (isHighRisk) {
        const incidentType = checkIncidentType(query)
        suggestedActions.push({ type: 'start_incident', preset_type: incidentType || 'other' })
      }
      suggestedActions.push({ type: 'rephrase' })
      suggestedActions.push({ type: 'pin_quick_ref' })
    }

    // Generate follow_up_questions if empty
    if (followUpQuestions.length === 0) {
      followUpQuestions = generateFollowUpQuestions(query, llmResponse.answer)
    }

    // Step 9: Save audit log
    await saveAuditLog(tenantId, userId, query, llmResponse.answer, matches, citations, confidence, requiresEscalation)

    if (requiresEscalation) {
      await saveToHITLQueue(tenantId, userId, query, llmResponse.answer, matches, confidence, isHighRisk ? 'high' : 'medium')
    }

    return {
      answer: llmResponse.answer,
      steps,
      citations,
      confidence,
      requires_escalation: requiresEscalation,
      escalation_reason: requiresEscalation ? (isHighRisk ? 'High-risk scenario detected' : 'Low confidence response') : null,
      policy_not_found: false,
      forms_required: llmResponse.forms_required || [],
      notifications_required: llmResponse.notifications_required || [],
      suggested_actions: suggestedActions,
      follow_up_questions: followUpQuestions,
      source: 'rag',
    }
  } catch (error) {
    console.error('[RAG] Error processing query:', error)
    throw error
  }
}

async function saveAuditLog(tenantId, userId, query, answer, retrievedChunks, citations, confidence, escalated) {
  try {
    await supabase.from('rag_audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      query,
      answer,
      retrieved_chunks: retrievedChunks,
      citations,
      confidence,
      escalated,
      model_name: config.openaiChatModel,
      model_version: '1.0',
    })
  } catch (error) {
    console.error('Error saving audit log:', error)
  }
}

async function saveToHITLQueue(tenantId, userId, query, draftAnswer, retrievedChunks, confidence, riskLevel) {
  try {
    await supabase.from('hitl_queue').insert({
      tenant_id: tenantId,
      user_id: userId,
      query,
      draft_answer: draftAnswer,
      retrieved_chunks: retrievedChunks,
      confidence,
      risk_level: riskLevel,
      status: 'pending',
    })
  } catch (error) {
    console.error('Error saving to HITL queue:', error)
  }
}

function extractStepsFromText(text) {
  const steps = []
  const lines = text.split(/\n/)
  let currentStep = ''

  for (const line of lines) {
    const match = line.match(/^(?:\*?\s*)?(?:Step\s+)?(\d+)[\.\)\:\-]\s*(.+)$/i)
    if (match) {
      if (currentStep) steps.push(currentStep.trim())
      currentStep = match[2].trim()
    } else if (currentStep && line.trim().startsWith('- ')) {
      currentStep += ' ' + line.trim().replace(/^-\s*/, '— ')
    } else if (currentStep && line.trim() && !line.match(/^\d+[\.\)\:]/)) {
      currentStep += ' ' + line.trim()
    }
  }
  if (currentStep) steps.push(currentStep.trim())
  return steps
}

function generateFollowUpQuestions(query, answer) {
  const questions = []
  const lowerQuery = query.toLowerCase()
  const lowerAnswer = answer.toLowerCase()

  if (lowerAnswer.includes('notify') || lowerAnswer.includes('contact')) {
    questions.push('Who should I notify first?')
  }
  if (lowerAnswer.includes('document') || lowerAnswer.includes('report') || lowerAnswer.includes('form')) {
    questions.push('What forms do I need to complete?')
  }
  if (lowerAnswer.includes('rn') || lowerAnswer.includes('registered nurse') || lowerAnswer.includes('supervisor')) {
    questions.push('What if the RN is not available?')
  }
  if (lowerQuery.includes('fall')) {
    questions.push('What if the resident refuses assessment?')
    questions.push('When should I call emergency services?')
  }
  if (lowerQuery.includes('medication')) {
    questions.push('What if the resident already took the medication?')
    questions.push('Do I need to report this immediately?')
  }
  if (questions.length === 0) {
    questions.push('Can you explain this in simpler terms?')
    questions.push('What should I do next?')
  }
  return questions.slice(0, 3)
}
