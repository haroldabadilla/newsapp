export function errorHandler(err, req, res, _next) {
  // Axios (upstream) errors — already present if you added news proxy logging
  if (err?.isAxiosError) {
    const status = err.response?.status || 502;
    const payload = err.response?.data || { message: err.message };
    console.error('Axios upstream error:', status, payload);
    return res.status(status).json({
      error: { code: 'UPSTREAM_ERROR', message: payload?.message || 'Upstream error' }
    });
  }

  // Zod validation
  if (err?.name === 'ZodError') {
    console.error('Zod validation error:', err.issues);
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.issues?.[0]?.message || 'Invalid input' }
    });
  }

  // Mongoose validation / cast errors
  if (err?.name === 'ValidationError') {
    console.error('Mongoose validation error:', err);
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message || 'Invalid document' }
    });
  }
  if (err?.name === 'CastError') {
    console.error('Mongoose cast error:', err);
    return res.status(400).json({
      error: { code: 'CAST_ERROR', message: 'Invalid id or field format' }
    });
  }

  // Duplicate key (e.g., favorites unique per user+url) — you already handle in route, but keep here too
  if (err?.code === 11000) {
    console.error('Duplicate key error:', err?.keyValue);
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: 'Duplicate key' }
    });
  }

  // Fallback
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}