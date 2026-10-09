// Simple staff sign-in (a first version, meant to be replaced by real staff accounts later).
//
//  * One username and password live in .env (STAFF_USERNAME, STAFF_PASSWORD).
//  * A correct login returns a signed token that expires (STAFF_SESSION_HOURS, default 8).
//    The token is stateless: nothing is stored in the database.
//  * The older x-admin-token header (ADMIN_TOKEN) still works, so the original dashboard
//    at /admin.html keeps running.
//
// Ideas for the next version are listed in docs/STAFF_DASHBOARD.md.
const crypto = require('crypto');

let generatedSecret = null;
function secret() {
  if (process.env.STAFF_SESSION_SECRET) return process.env.STAFF_SESSION_SECRET;
  // No secret set: make one for this run. Everyone is signed out whenever the server restarts.
  if (!generatedSecret) generatedSecret = crypto.randomBytes(32).toString('hex');
  return generatedSecret;
}

const sessionMs = () => (parseFloat(process.env.STAFF_SESSION_HOURS) > 0 ? parseFloat(process.env.STAFF_SESSION_HOURS) : 8) * 3600 * 1000;
const sign = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');
const digest = (v) => crypto.createHash('sha256').update(String(v)).digest();
const sameText = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

const loginEnabled = () => Boolean(process.env.STAFF_USERNAME && process.env.STAFF_PASSWORD);

// Both fields are always compared, so timing does not reveal which one was wrong.
function checkCredentials(username, password) {
  const userOk = sameText(username || '', process.env.STAFF_USERNAME || '');
  const passOk = sameText(password || '', process.env.STAFF_PASSWORD || '');
  return loginEnabled() && userOk && passOk;
}

function issueToken(username) {
  const expiresAt = Date.now() + sessionMs();
  const payload = Buffer.from(JSON.stringify({ u: username, exp: expiresAt })).toString('base64url');
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

function verifyToken(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() ? { username: data.u, expiresAt: data.exp } : null;
  } catch {
    return null;
  }
}

function requireStaff(req, res, next) {
  const bearer = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
  if (bearer) {
    const session = verifyToken(bearer[1]);
    if (!session) return res.status(401).json({ error: 'Your session has ended. Please sign in again.', code: 'BAD_SESSION' });
    req.staff = session;
    return next();
  }

  // Original shared-token header, kept for the legacy dashboard
  const legacy = req.get('x-admin-token');
  if (legacy !== undefined) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) return res.status(503).json({ error: 'The staff dashboard is off. Set ADMIN_TOKEN in .env to turn it on.', code: 'ADMIN_OFF' });
    if (!sameText(legacy, expected)) return res.status(401).json({ error: 'Wrong staff token.', code: 'BAD_TOKEN' });
    req.staff = { username: 'admin-token' };
    return next();
  }

  if (!process.env.ADMIN_TOKEN && !loginEnabled()) {
    return res.status(503).json({ error: 'The staff dashboard is off. Set STAFF_USERNAME and STAFF_PASSWORD in .env to turn it on.', code: 'ADMIN_OFF' });
  }
  return res.status(401).json({ error: 'Please sign in.', code: 'UNAUTHENTICATED' });
}

module.exports = { loginEnabled, checkCredentials, issueToken, verifyToken, requireStaff };
