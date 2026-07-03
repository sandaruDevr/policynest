import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4-turbo-preview',
  port: process.env.PORT || 3001,
  internalSharedSecret: process.env.INTERNAL_SHARED_SECRET,
  env: process.env.NODE_ENV || 'production',
  rateLimit: {
    generalWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    generalMax: Number(process.env.RATE_LIMIT_MAX) || 120,
    strictWindowMs: Number(process.env.RATE_LIMIT_STRICT_WINDOW_MS) || 60_000,
    strictMax: Number(process.env.RATE_LIMIT_STRICT_MAX) || 30,
  },
}

// Fail fast on missing required configuration instead of surfacing opaque
// runtime errors deep inside request handling.
const REQUIRED = {
  SUPABASE_URL: config.supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: config.supabaseServiceRoleKey,
  OPENAI_API_KEY: config.openaiApiKey,
  INTERNAL_SHARED_SECRET: config.internalSharedSecret,
}

export function validateConfig() {
  const missing = Object.entries(REQUIRED)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set them in server/.env before starting the server.`,
    )
  }

  if (config.env === 'production' && config.internalSharedSecret === 'dev-secret-change-in-production') {
    throw new Error(
      'INTERNAL_SHARED_SECRET is still the development default in production. Set a strong unique secret.',
    )
  }
}
