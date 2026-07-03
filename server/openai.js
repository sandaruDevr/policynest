import OpenAI from 'openai'
import { config } from './config.js'

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
})

export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: config.openaiEmbeddingModel,
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

// Batch embedding - much more efficient (single API call for up to 2048 inputs)
export async function generateEmbeddingsBatch(texts) {
  try {
    const response = await openai.embeddings.create({
      model: config.openaiEmbeddingModel,
      input: texts,
    })
    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating batch embeddings:', error)
    throw error
  }
}

export async function generateChatCompletion(messages, options = {}) {
  const params = {
    model: config.openaiChatModel,
    messages,
    response_format: options.jsonObject !== false ? { type: 'json_object' } : undefined,
  }
  if (options.temperature !== undefined) params.temperature = options.temperature
  // Newer models (gpt-5 / o-series) require max_completion_tokens instead of max_tokens.
  if (options.maxTokens !== undefined) params.max_completion_tokens = options.maxTokens

  const extractContent = (response) =>
    options.jsonObject === false
      ? response.choices[0].message.content
      : JSON.parse(response.choices[0].message.content)

  // Auto-recover from model-specific unsupported-parameter errors
  // (e.g. gpt-5 / o-series reject `max_tokens` and non-default `temperature`).
  const MAX_PARAM_RETRIES = 3
  for (let attempt = 0; attempt <= MAX_PARAM_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create(params)
      return extractContent(response)
    } catch (error) {
      const param = error?.param
      const recoverable = error?.code === 'unsupported_parameter' && attempt < MAX_PARAM_RETRIES
      if (recoverable && param === 'max_tokens') {
        delete params.max_tokens
        if (options.maxTokens !== undefined) params.max_completion_tokens = options.maxTokens
        continue
      }
      if (recoverable && param === 'max_completion_tokens') {
        delete params.max_completion_tokens
        if (options.maxTokens !== undefined) params.max_tokens = options.maxTokens
        continue
      }
      if (recoverable && param === 'temperature') {
        delete params.temperature
        continue
      }
      console.error('Error generating chat completion:', error)
      throw error
    }
  }
}
