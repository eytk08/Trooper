require('./config/env'); // must be first: loads .env and sets the time zone
const path = require('path');
const express = require('express');
const db = require('./config/db');
const notifier = require('./services/notifier');
const { AppError } = require('./services/errors');

const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use(express.json({ limit: '20kb' }));

// Used by Docker and hosting platforms to see if the app and database are alive
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false });
  }
});

app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.', code: 'NOT_FOUND' }));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/index.html'));

// Errors: known ones keep their message, anything else is logged and hidden from the user.
app.use((err, req, res, next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(400).json({ error: 'Invalid request.', code: 'BAD_REQUEST' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.', code: 'SERVER_ERROR' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Trooper running at http://localhost:${port}`);
    notifier.start();
  });
}
module.exports = app;
