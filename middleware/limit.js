const rateLimit = require('express-rate-limit');

function limit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skip = () => false,
    ...rest
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip,
    message: typeof message === 'string' ? { error: message } : message,
    ...rest
  });
}

module.exports = limit;
module.exports.limit = limit;