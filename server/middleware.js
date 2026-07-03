import rateLimit from 'express-rate-limit'

// ---------------------------------------------------------------------
// Structured logging
// ---------------------------------------------------------------------

function logger({ level, type, path, method, status, durationMs, ip, error, meta }) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    type,
    path,
    method,
    status,
    durationMs,
    ip: ip || undefined,
    error: error ? (error.message || String(error)) : undefined,
    meta,
  }
  // Remove undefined keys for cleaner JSON
  Object.keys(log).forEach((k) => log[k] === undefined && delete log[k])
  console.log(JSON.stringify(log))
}

export function structuredLogger(req, res, next) {
  const start = Date.now()
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress

  res.on('finish', () => {
    logger({
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      type: 'request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip,
    })
  })

  next()
}

export function logError(error, req) {
  logger({
    level: 'error',
    type: 'error',
    method: req?.method,
    path: req?.path,
    ip: req?.ip || req?.headers?.['x-forwarded-for'],
    error,
  })
}

// ---------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------

export function createLimiter({ windowMs = 60_000, max = 100, message = 'Too many requests' } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, _next, options) {
      logger({
        level: 'warn',
        type: 'rate_limit',
        method: req.method,
        path: req.path,
        ip: req.ip,
        meta: { windowMs, max },
      })
      res.status(options.statusCode).json({ error: options.message })
    },
  })
}

export const generalLimiter = createLimiter({ windowMs: 60_000, max: 120 })
export const strictLimiter = createLimiter({ windowMs: 60_000, max: 30 })

// ---------------------------------------------------------------------
// Async route wrapper
// ---------------------------------------------------------------------

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// ---------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------

export function globalErrorHandler(err, req, res, _next) {
  logError(err, req)
  const isDev = process.env.NODE_ENV === 'development'
  res.status(err.status || 500).json({
    error: err.expose ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  })
}

// ---------------------------------------------------------------------
// Zod validation helper
// ---------------------------------------------------------------------

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const error = new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '))
      error.status = 400
      error.expose = true
      return next(error)
    }
    req.validated = result.data
    next()
  }
}
