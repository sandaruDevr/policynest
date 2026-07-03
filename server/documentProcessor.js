import { generateEmbedding, generateEmbeddingsBatch } from './openai.js'
import { supabase } from './supabase.js'
import { structureDocument } from './documentStructurer.js'

export function chunkDocument(text, options = {}) {
  const {
    chunkSize = 800,
    overlap = 200,
    title = 'Document',
    sector = '',
    framework = [],
    riskLevel = '',
  } = options

  const chunks = []
  let currentIndex = 0

  // Try to split by sections first. Tolerate leading whitespace/indentation
  // before markdown headings (e.g. when text is pasted with a leading space).
  const headingRe = /^[ \t]*#{1,3}\s+/
  const sections = text.split(/(?=\n[ \t]*#{1,3}\s)/g).filter(s => s.trim())

  if (sections.length > 1) {
    // Split by sections
    sections.forEach((section, index) => {
      const lines = section.split('\n')
      const headingIdx = lines.findIndex(l => headingRe.test(l))
      const headingLine = headingIdx >= 0 ? lines[headingIdx] : ''
      const sectionTitle = headingLine.replace(headingRe, '').trim()
      const sectionContent = lines
        .filter((_, i) => i !== headingIdx)
        .join('\n')
        .trim()

      if (sectionContent.length > 0) {
        // Further split large sections into chunks
        const subChunks = splitTextIntoChunks(sectionContent, chunkSize, overlap)
        subChunks.forEach((subChunk, subIndex) => {
          chunks.push({
            content: subChunk,
            section_title: sectionTitle,
            section_number: index + 1,
            chunk_index: currentIndex++,
            metadata: {
              source: 'manual_upload',
              title,
              sector,
              framework,
              risk_level: riskLevel,
            },
          })
        })
      }
    })
  } else {
    // Split by character count
    const textChunks = splitTextIntoChunks(text, chunkSize, overlap)
    textChunks.forEach((chunk, index) => {
      chunks.push({
        content: chunk,
        section_title: title,
        chunk_index: currentIndex++,
        metadata: {
          source: 'manual_upload',
          title,
          sector,
          framework,
          risk_level: riskLevel,
        },
      })
    })
  }

  return chunks
}

// Slugify a heading into a stable section anchor.
function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'section'
  )
}

// Extract top-level sections (by markdown headings) for staff library display.
// Returns [{ anchor, title, body, ord }]. Falls back to a single Overview
// section when the document has no headings.
export function extractSections(text, fallbackTitle = 'Overview') {
  const headingLineRe = /^[ \t]*#{1,3}\s+/
  const parts = text.split(/(?=\n?[ \t]*#{1,3}\s)/g).filter((s) => s.trim())
  const sections = []
  const seen = new Map()

  const pushSection = (title, body) => {
    const trimmedBody = body.trim()
    // Skip orphan/title-only sections (e.g. the H1 document title with no body).
    if (!trimmedBody) return
    const baseAnchor = slugify(title)
    let anchor = baseAnchor
    let n = seen.get(baseAnchor) || 0
    if (n > 0) anchor = `${baseAnchor}-${n}`
    seen.set(baseAnchor, n + 1)
    sections.push({
      anchor,
      title: title.slice(0, 200),
      body: trimmedBody,
      ord: sections.length,
    })
  }

  if (parts.length <= 1 && !headingLineRe.test(text) && !/\n[ \t]*#{1,3}\s/.test(text)) {
    pushSection(fallbackTitle, text)
    return sections
  }

  parts.forEach((part) => {
    const lines = part.split('\n')
    const headingLine = lines.find((l) => headingLineRe.test(l))
    if (headingLine) {
      const title = headingLine.replace(headingLineRe, '').trim()
      const body = lines
        .filter((l) => l !== headingLine)
        .join('\n')
        .trim()
      if (title) pushSection(title, body)
    } else if (part.trim()) {
      // Leading preamble before the first heading.
      pushSection(fallbackTitle, part)
    }
  })

  return sections.length > 0 ? sections : [{ anchor: 'overview', title: fallbackTitle, body: text.trim(), ord: 0 }]
}

function splitTextIntoChunks(text, chunkSize, overlap) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = start + chunkSize
    let isLast = false
    if (end >= text.length) {
      end = text.length
      isLast = true
    } else {
      // Try to break at a sentence boundary
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastPeriod, lastNewline)

      if (breakPoint > start + chunkSize / 2) {
        end = breakPoint + 1
      }
    }

    chunks.push(text.slice(start, end).trim())

    if (isLast) break

    const nextStart = end - overlap
    // Ensure progress to prevent infinite loop
    start = nextStart > start ? nextStart : end
  }

  return chunks.filter(c => c.length > 0)
}

export async function processDocument(documentId, tenantId, text, options = {}) {
  try {
    console.log(`[${documentId}] Starting processing, raw text length: ${text?.length || 0}`)

    if (!text || text.length === 0) {
      throw new Error('Document text is empty')
    }

    // Limit text size to prevent excessive memory usage (5MB)
    if (text.length > 5_000_000) {
      throw new Error('Document too large (max 5MB)')
    }

    // ------------------------------------------------------------------
    // STEP 1: AI Structure (always run unless explicitly skipped)
    // ------------------------------------------------------------------
    let workingText = text
    let structuredMeta = null
    const shouldStructure = options.structure !== false

    if (shouldStructure) {
      console.log(`[${documentId}] Running AI structuring...`)
      structuredMeta = await structureDocument(text, { maxSegment: options.maxSegment })
      workingText = structuredMeta.markdown || text
      console.log(`[${documentId}] Structured text length: ${workingText.length}`)
    }

    // ------------------------------------------------------------------
    // STEP 2: Idempotency — clear old chunks + sections
    // ------------------------------------------------------------------
    await supabase.from('document_chunks').delete().eq('document_id', documentId)
    await supabase.from('document_sections').delete().eq('document_id', documentId)

    // ------------------------------------------------------------------
    // STEP 3: Populate document_sections (staff library display)
    // Use AI-extracted sections when available; otherwise fallback to regex.
    // ------------------------------------------------------------------
    let sections
    if (structuredMeta?.sections && structuredMeta.sections.length > 0) {
      const seenAnchors = new Map()
      sections = structuredMeta.sections.map((s, i) => {
        const baseAnchor = slugify(s.title)
        const n = seenAnchors.get(baseAnchor) || 0
        seenAnchors.set(baseAnchor, n + 1)
        return {
          anchor: n > 0 ? `${baseAnchor}-${n}` : baseAnchor,
          title: s.title,
          body: s.body,
          ord: i,
        }
      })
      console.log(`[${documentId}] Using ${sections.length} AI-extracted sections`)
    } else {
      sections = extractSections(workingText, options.title || 'Overview')
      console.log(`[${documentId}] Using ${sections.length} regex-extracted sections (fallback)`)
    }

    if (sections.length > 0) {
      const sectionRows = sections.map((s) => ({
        tenant_id: tenantId,
        document_id: documentId,
        anchor: s.anchor,
        title: s.title,
        body: s.body,
        ord: s.ord,
      }))
      const { error: sectionError } = await supabase
        .from('document_sections')
        .insert(sectionRows)
      if (sectionError) throw sectionError
      console.log(`[${documentId}] Inserted ${sectionRows.length} sections`)
    }

    // ------------------------------------------------------------------
    // STEP 4: Chunk + embed + insert
    // ------------------------------------------------------------------
    const chunks = chunkDocument(workingText, options)
    console.log(`[${documentId}] Created ${chunks.length} chunks`)

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document')
    }

    const BATCH_SIZE = 50
    let totalInserted = 0
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const batch = chunks.slice(i, i + BATCH_SIZE)
      const texts = batch.map(c => c.content)

      console.log(`[${documentId}] Batch ${batchNum}/${totalBatches}: embedding ${texts.length} chunks`)
      const embeddings = await generateEmbeddingsBatch(texts)

      const rows = batch.map((chunk, idx) => ({
        ...chunk,
        tenant_id: tenantId,
        document_id: documentId,
        embedding: embeddings[idx],
        allowed_roles: options.allowedRoles || [],
        site_ids: options.siteIds || [],
        language: options.language || 'en',
      }))

      console.log(`[${documentId}] Batch ${batchNum}/${totalBatches}: inserting to DB`)
      const { error } = await supabase.from('document_chunks').insert(rows)
      if (error) throw error

      totalInserted += rows.length
    }

    console.log(`[${documentId}] Done: ${totalInserted} chunks inserted`)
    return {
      success: true,
      chunks: totalInserted,
      structured: !!structuredMeta,
      structuredContent: structuredMeta?.markdown || workingText,
      summary: structuredMeta?.summary || '',
      suggestedTitle: structuredMeta?.title || '',
      suggestedCategory: structuredMeta?.category || '',
      suggestedRiskLevel: structuredMeta?.riskLevel || '',
      suggestedTags: structuredMeta?.tags || '',
      suggestedSector: structuredMeta?.sector || '',
    }
  } catch (error) {
    console.error(`[${documentId}] Error:`, error.message)
    throw error
  }
}
