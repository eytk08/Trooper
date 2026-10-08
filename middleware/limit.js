// Tiny in-memory rate limiter (per IP). Fine for a demo. Use a shared store for real hosting.
function limit({ max, windowMs, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((time) => now - time < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ error: message || 'Too many requests. Please try again in a few minutes.', code: 'RATE_LIMIT' });
    }
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
}
module.exports = limit;
