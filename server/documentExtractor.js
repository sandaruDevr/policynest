import { promises as fs } from 'fs'
import path from 'path'

let pdfParse, mammoth

async function loadDeps() {
  if (!pdfParse) {
    const mod = await import('pdf-parse')
    pdfParse = mod.default || mod
  }
  if (!mammoth) {
    const mod = await import('mammoth')
    mammoth = mod.default || mod
  }
}

export async function extractTextFromFile(filePath, mimetype) {
  await loadDeps()
  const ext = path.extname(filePath).toLowerCase()
  const type = mimetype || ''

  if (ext === '.pdf' || type.includes('pdf')) {
    return extractPdf(filePath)
  }

  if (ext === '.docx' || ext === '.doc' || type.includes('word')) {
    return extractDocx(filePath)
  }

  if (ext === '.txt' || ext === '.md' || type.includes('text') || type.includes('markdown')) {
    return fs.readFile(filePath, 'utf-8')
  }

  throw new Error(`Unsupported file type: ${ext || mimetype}. Supported: .pdf, .docx, .doc, .txt, .md`)
}

async function extractPdf(filePath) {
  const buffer = await fs.readFile(filePath)
  const data = await pdfParse(buffer)
  const text = data.text || ''
  if (!text.trim()) {
    throw new Error('PDF contains no extractable text. It may be a scanned image — use OCR before upload.')
  }
  return text
}

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath })
  if (result.messages.length > 0) {
    console.log('[Extractor] mammoth messages:', result.messages.map(m => m.message).join('; '))
  }
  const text = result.value || ''
  if (!text.trim()) {
    throw new Error('DOCX contains no extractable text.')
  }
  return text
}
