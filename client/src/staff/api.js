// Talks to /api/admin/*. The session lives in sessionStorage, so closing the tab signs the
// staff member out. (A later version can move this to an httpOnly cookie.)
const KEY = 'trooper-staff-session';

export const session = {
  get() {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY));
      return s && s.expiresAt > Date.now() ? s : null;
    } catch {
      return null;
    }
  },
  set(value) {
    try { sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* storage blocked */ }
  },
  clear() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};

let onSignedOut = () => {};
export const setSignedOutHandler = (fn) => { onSignedOut = fn; };

// Never throws. Always returns { ok, status, data, code, error }.
async function request(url, { method = 'GET', body, auth = true } = {}) {
  const s = auth ? session.get() : null;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (s) headers.Authorization = `Bearer ${s.token}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    return { ok: false, status: 0, data: null, code: 'NETWORK', error: 'Cannot reach the server. Check your connection and try again.' };
  }
  let data = null;
  try { data = await res.json(); } catch { /* no JSON body */ }

  // An expired or invalid session sends the user back to the sign-in page
  if (res.status === 401 && auth && url !== '/api/admin/login') onSignedOut();

  return {
    ok: res.ok,
    status: res.status,
    data,
    code: data?.code || null,
    error: res.ok ? null : data?.error || 'Something went wrong. Please try again.',
  };
}

export const staffApi = (path, options) => request(`/api/admin${path}`, options);
// Public booking endpoints (no sign-in needed), used to list open slots for a doctor
export const publicApi = (path) => request(`/api${path}`, { auth: false });

export async function signIn(username, password) {
  const r = await request('/api/admin/login', { method: 'POST', body: { username, password }, auth: false });
  if (r.ok) session.set({ token: r.data.token, expiresAt: r.data.expiresAt, user: r.data.user });
  return r;
}
