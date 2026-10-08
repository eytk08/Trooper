// Staff dashboard. Everything is drawn with textContent, so stored text can never run as HTML.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let token = sessionStorage.getItem('trooperToken') || '';
  let timer = null;

  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const hhmm = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

  async function call(path, method = 'GET') {
    try {
      const res = await fetch('/api/admin' + path, { method, headers: { 'x-admin-token': token } });
      let data = {};
      try { data = await res.json(); } catch (e) { /* empty */ }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Cannot reach the server.' } };
    }
  }

  function rows(body, list, columns, emptyText) {
    body.replaceChildren();
    if (!list.length) {
      const tr = el('tr'); const td = el('td', emptyText, 'empty'); td.colSpan = columns.length; tr.append(td); body.append(tr); return;
    }
    list.forEach((item) => {
      const tr = el('tr');
      columns.forEach((c) => { const td = el('td'); const v = c(item); if (v instanceof Node) td.append(v); else td.textContent = v; tr.append(td); });
      body.append(tr);
    });
  }

  const badge = (text, kind) => el('span', text, `badge text-bg-${kind}`);
  const statusKind = { confirmed: 'success', cancelled: 'secondary', sent: 'success', queued: 'warning', failed: 'danger', skipped: 'secondary' };

  function bars(holder, list, labelKey) {
    holder.replaceChildren();
    if (!list.length) { holder.append(el('p', 'No bookings yet.', 'empty')); return; }
    const max = Math.max(...list.map((x) => x.booked));
    list.forEach((x) => {
      const row = el('div', undefined, 'bar-row');
      const track = el('div', undefined, 'track'); const fill = el('div', undefined, 'fill'); fill.style.width = `${(x.booked / max) * 100}%`; track.append(fill);
      row.append(el('span', x[labelKey], 'name'), track, el('span', String(x.booked), 'count'));
      holder.append(row);
    });
  }

  async function refresh() {
    const r = await call('/summary');
    if (!r.ok) {
      if (r.status === 401 || r.status === 503) return signOut(r.data.error);
      const a = $('dashAlert'); a.className = 'alert alert-danger'; a.textContent = r.data.error || 'Could not load.'; return;
    }
    $('dashAlert').className = 'alert d-none';
    const d = r.data;
    $('todayDate').textContent = d.today;
    $('sUpcoming').textContent = d.stats.upcoming; $('sToday').textContent = d.stats.today;
    $('sCancelled').textContent = d.stats.cancelled; $('sTotal').textContent = d.stats.total;

    rows($('todayBody'), d.todayList, [
      (a) => hhmm(a.start), (a) => `${a.patient} (${a.class})`, (a) => a.doctor, (a) => a.clinic || a.department,
      (a) => badge(a.status, statusKind[a.status])
    ], 'No appointments today.');

    const counts = d.notifications.counts;
    const qb = $('queueBadges'); qb.replaceChildren();
    ['queued', 'sent', 'failed', 'skipped'].forEach((s) => qb.append(badge(`${s}: ${counts[s] || 0}`, statusKind[s])));
    rows($('msgBody'), d.notifications.recent, [
      (n) => n.type, (n) => n.phone, (n) => badge(n.status, statusKind[n.status]), (n) => n.sendAt.slice(5, 16)
    ], 'No messages yet.');

    bars($('deptBars'), d.byDepartment, 'department');
    bars($('docBars'), d.doctorLoad, 'doctor');
    $('updated').textContent = 'Updated ' + new Date().toLocaleTimeString();
  }

  function showDash() {
    $('loginCard').classList.add('d-none'); $('dash').classList.remove('d-none'); $('logoutBtn').classList.remove('d-none');
    refresh(); clearInterval(timer); timer = setInterval(refresh, 15000);
  }

  function signOut(message) {
    token = ''; sessionStorage.removeItem('trooperToken'); clearInterval(timer);
    $('dash').classList.add('d-none'); $('logoutBtn').classList.add('d-none'); $('loginCard').classList.remove('d-none');
    const a = $('loginAlert'); if (message) { a.textContent = message; a.className = 'alert alert-danger'; } else a.className = 'alert alert-danger d-none';
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    token = $('token').value;
    const r = await call('/summary');
    if (r.ok) { sessionStorage.setItem('trooperToken', token); $('token').value = ''; showDash(); }
    else signOut(r.data.error || 'Could not sign in.');
  });
  $('logoutBtn').addEventListener('click', () => signOut());
  $('runBtn').addEventListener('click', async () => {
    const btn = $('runBtn'); btn.disabled = true;
    const r = await call('/run-notifier', 'POST');
    const a = $('dashAlert');
    if (r.ok) { a.className = 'alert alert-success'; a.textContent = `Automation ran: ${r.data.sent} sent, ${r.data.retried} to retry, ${r.data.failed} failed.`; }
    else { a.className = 'alert alert-danger'; a.textContent = r.data.error || 'Run failed.'; }
    btn.disabled = false; refresh();
  });

  if (token) showDash();
})();
