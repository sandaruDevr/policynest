import { generateChatCompletion } from './openai.js'

const STRUCTURE_SYSTEM_PROMPT = `You are a document-normalisation engine for an Australian aged-care policy management system.

Your task: take raw policy text (which may be garbled from PDF extraction, rendered-page copy-paste, or OCR) and output:
1. Clean, well-formed GitHub-flavour Markdown.
2. A very short 1-sentence summary (max 140 characters).
3. Suggested metadata.

## Markdown rules
- Preserve every factual sentence exactly. Do NOT change any numbers, times, names, thresholds, or clinical steps.
- Reconstruct the heading hierarchy: the top-level policy name stays as H1. Every major section becomes H2 (\`##\`). Sub-sections become H3 (\`###\`).
- Reformat bullet lists into clean \`- \` lists in TIGHT format: each bullet on its own line, absolutely NO blank lines between bullets, and NO blank lines inside a single bullet item. Each bullet should be one continuous text line.
- Reformat numbered lists into clean \`1.\` \`2.\` \`3.\` lists in TIGHT format: each number on its own line, absolutely NO blank lines between items.
- Preserve ALL paragraph breaks. Separate paragraphs with blank lines. Do NOT collapse multiple lines into a single line.
- Preserve line breaks within paragraphs (e.g. after colons, semicolons, or list item text) by ending lines with two spaces (markdown hard break) when appropriate.
- Use proper markdown syntax: \`**bold**\` for emphasis, \`*italic*\` for subtle emphasis, \` \`inline code\` \` for technical terms.
- Keep tables as markdown tables (\`| header | header |\`).
- Remove page numbers, headers, footers, repeated document titles between pages, and other extraction artifacts.
- Do NOT add a preamble or closing note — output only the markdown.
- Do NOT wrap output in code fences.

## Summary rules
- One sentence. Maximum 140 characters.
- Plain text (no markdown). Capture what the document covers.

## Metadata rules
- title: best clean policy title (no "Policy" suffix if already implied).
- category: one of [Clinical, Compliance, Operations, Workforce, Governance, Safety].
- riskLevel: one of [low, medium, high].
- tags: 3-6 concise keywords (lowercase, no spaces; comma-separated string).
- sector: "aged-care" for aged care policies.

If the text is not a policy but a procedure or guideline, still output clean markdown and appropriate metadata.
`

const MAX_SEGMENT = 9000

export async function structureDocument(rawText, options = {}) {
  const maxSegment = options.maxSegment ?? MAX_SEGMENT

  // 1. Split large docs into segments for safe token limits
  const segments = splitIntoSegments(rawText, maxSegment)
  const structuredSegments = []

  for (let i = 0; i < segments.length; i++) {
    console.log(`[Structurer] Segment ${i + 1}/${segments.length} (${segments[i].length} chars)`)
    const structured = await structureSegment(segments[i])
    structuredSegments.push(structured)
  }

  let combinedMarkdown = structuredSegments.join('\n\n---\n\n')

  // 2. Normalize: force tight lists (remove blank lines between bullet/number items)
  combinedMarkdown = normalizeMarkdown(combinedMarkdown)

  // 3. AI-powered section extraction (replaces regex splitting)
  console.log(`[Structurer] Extracting sections with AI...`)
  const sections = await extractSectionsWithAI(combinedMarkdown)

  // 4. Generate summary + metadata on the combined markdown
  const meta = await generateMeta(combinedMarkdown)

  return {
    markdown: combinedMarkdown,
    sections,
    summary: meta.summary,
    title: meta.title,
    category: meta.category,
    riskLevel: meta.riskLevel,
    tags: meta.tags,
    sector: meta.sector,
  }
}

function splitIntoSegments(text, maxLen) {
  if (text.length <= maxLen) return [text]
  const segments = []
  let start = 0
  while (start < text.length) {
    let end = start + maxLen
    if (end >= text.length) {
      segments.push(text.slice(start))
      break
    }
    // Find the nearest paragraph boundary
    const boundary = text.lastIndexOf('\n\n', end)
    if (boundary > start + maxLen * 0.5) {
      segments.push(text.slice(start, boundary))
      start = boundary + 2
    } else {
      segments.push(text.slice(start, end))
      start = end
    }
  }
  return segments
}

async function structureSegment(text) {
  const messages = [
    { role: 'system', content: STRUCTURE_SYSTEM_PROMPT },
    { role: 'user', content: `RAW TEXT:\n\n${text}\n\nOUTPUT ONLY the cleaned markdown for this segment. No preamble, no closing note.` },
  ]

  try {
    const result = await generateChatCompletion(messages, {
      temperature: 0.2,
      maxTokens: 4000,
      jsonObject: false,
    })
    return result.trim()
  } catch (err) {
    console.error('[Structurer] Segment structuring failed, returning raw:', err.message)
    return text
  }
}

const META_PROMPT = `You are a metadata extractor for aged-care policy documents.

Given the clean markdown below, output a JSON object with these exact keys:
- summary: a single plain-text sentence (max 140 characters) describing what this document covers
- title: the best concise policy title (string)
- category: one of [Clinical, Compliance, Operations, Workforce, Governance, Safety] (string)
- riskLevel: one of [low, medium, high] (string)
- tags: comma-separated string of 3-6 lowercase keywords, no spaces (e.g. "falls,prevention,safety")
- sector: "aged-care" (string)

Rules:
- The summary MUST be plain text, no markdown, no quotes, max 140 characters.
- The title should be clean without redundant words like "Policy Document".
- If the document is clearly about falls, medication, wounds, infection, or palliative care, category is Clinical.
- If about rights, complaints, audits, or standards, category is Compliance.
- If about staff, training, rosters, or recruitment, category is Workforce.
- If about buildings, equipment, or IT, category is Operations.
`

async function generateMeta(markdown) {
  const messages = [
    { role: 'system', content: META_PROMPT },
    { role: 'user', content: `MARKDOWN:\n\n${markdown.slice(0, 8000)}\n\nReturn ONLY the JSON object.` },
  ]

  try {
    const result = await generateChatCompletion(messages, {
      temperature: 0.2,
      maxTokens: 500,
    })
    return {
      summary: clampString(result.summary, 140),
      title: result.title || '',
      category: result.category || '',
      riskLevel: ['low', 'medium', 'high'].includes(result.riskLevel) ? result.riskLevel : 'medium',
      tags: parseTags(result.tags),
      sector: result.sector || 'aged-care',
    }
  } catch (err) {
    console.error('[Structurer] Metadata generation failed:', err.message)
    return {
      summary: '',
      title: '',
      category: '',
      riskLevel: 'medium',
      tags: '',
      sector: 'aged-care',
    }
  }
}

function clampString(s, max) {
  if (!s) return ''
  const t = String(s).trim()
  return t.length > max ? t.slice(0, max - 3) + '...' : t
}

const SECTIONIZE_PROMPT = `You are a document section extractor for an Australian aged-care policy management system.

Given the clean markdown below, output a JSON array of sections. Each section object must have exactly these keys:
- title: the section heading as plain text (strip any markdown # syntax; max 200 chars)
- body: the section content as clean markdown (preserve all formatting, lists, bold, italics, links, tables)

Rules:
- Split by major logical sections (H2 headings). Do NOT create separate sections for H3 sub-headings — keep them inside the parent section's body.
- IGNORE the top-level document title (the H1). Do NOT emit a section for it — the document title is displayed separately. Start with the first real content section.
- If the document has no clear headings, create a single section with title "Overview" and the full text as body.
- Do NOT include markdown heading syntax (#, ##) in the title field — titles must be plain text.
- Do NOT wrap the body in code fences.
- Preserve every factual sentence exactly in the body. Do NOT change numbers, times, names, thresholds, or clinical steps.
- NEVER emit a section with an empty body. Every section MUST have meaningful body content.
- Do NOT emit sections whose body is only a heading marker, separator (---), or whitespace.

Return ONLY the JSON array. No preamble, no closing note, no markdown formatting around the JSON.`

async function extractSectionsWithAI(markdown) {
  const messages = [
    { role: 'system', content: SECTIONIZE_PROMPT },
    { role: 'user', content: `MARKDOWN:\n\n${markdown.slice(0, 12000)}\n\nReturn a JSON object of the form { "sections": [ { "title": "...", "body": "..." } ] }.` },
  ]

  try {
    const result = await generateChatCompletion(messages, {
      temperature: 0.1,
      maxTokens: 4000,
    })

    // json_object mode returns an object; accept array or { sections: [...] }.
    const rawSections = Array.isArray(result)
      ? result
      : Array.isArray(result?.sections)
        ? result.sections
        : null

    if (!rawSections) {
      console.error('[Structurer] AI section extraction returned no array. Keys:', Object.keys(result || {}))
      return null
    }

    const cleaned = rawSections
      .map((s) => ({
        title: cleanTitle(s?.title),
        body: cleanBody(s?.body),
      }))
      .filter((s) => isMeaningful(s.body) && s.title)
      .map((s, i) => ({ ...s, ord: i }))

    return cleaned.length > 0 ? cleaned : null
  } catch (err) {
    console.error('[Structurer] Section extraction failed:', err.message)
    return null
  }
}

// Strip markdown heading syntax / surrounding markup from a section title.
function cleanTitle(title) {
  return String(title || '')
    .replace(/^[\s#>*_-]+/, '')
    .replace(/[\s#*_]+$/, '')
    .trim()
    .slice(0, 200)
}

// Trim a section body and remove leading separators / orphan heading markers.
function cleanBody(body) {
  let t = String(body || '').trim()
  // Drop a leading horizontal rule or stray heading marker line.
  t = t.replace(/^(-{3,}|#{1,6})\s*\n+/, '').trim()
  return t
}

// A body is meaningful only if it has real content beyond markup/separators.
function isMeaningful(body) {
  if (!body) return false
  const stripped = body.replace(/[#>*_`~\-\s]/g, '')
  return stripped.length > 0
}

// Remove blank lines between consecutive list items to force "tight" lists
// (loose lists wrap each item in <p>, producing extra vertical space).
function normalizeMarkdown(md) {
  const listItemRe = /^[ \t]*(?:[-*+]|\d+\.)\s+/

  return md
    .split('\n')
    .reduce((acc, line, i, arr) => {
      // Current line is a list item
      if (listItemRe.test(line)) {
        // Check if previous non-empty line was also a list item
        let prevIdx = acc.length - 1
        while (prevIdx >= 0 && acc[prevIdx] === '') prevIdx--
        const prev = acc[prevIdx] || ''
        // If there was a blank separator between two list items, skip it
        if (prevIdx >= 0 && listItemRe.test(prev) && acc.length - prevIdx > 1) {
          // Remove blank lines between list items: pop blank lines
          while (acc.length > prevIdx + 1) acc.pop()
        }
      }
      acc.push(line)
      return acc
    }, [])
    .join('\n')
}

function parseTags(tags) {
  if (!tags) return ''
  const arr = String(tags)
    .split(/[,;]/)
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .slice(0, 6)
  return arr.join(', ')
}
