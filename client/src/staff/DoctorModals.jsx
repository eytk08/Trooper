import React, { useState, useEffect } from 'react';
import { staffApi } from './api';
import { Modal, Field, ErrorNote, inputCls, btn } from './ui';
import { DAY_NAMES, WEEK_ORDER } from './format';

// ---------- Add / edit a doctor ----------
export function DoctorFormModal({ doctor, catalog, onClose, onSaved }) {
  const editing = Boolean(doctor);
  const [form, setForm] = useState({
    doctorName: doctor?.name || '',
    specialization: doctor?.specialization || '',
    department: doctor?.department || '',
    clinic: doctor?.clinic || '',
    status: doctor?.status || 'active',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const clinics = catalog.find((d) => d.slug === form.department)?.clinics || [];

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { ...form, clinic: form.clinic || null };
    const r = editing
      ? await staffApi(`/doctors/${doctor.id}`, { method: 'PUT', body })
      : await staffApi('/doctors', { method: 'POST', body });
    setBusy(false);
    if (r.ok) onSaved(editing ? `Updated ${r.data.name}` : `Added ${r.data.name}. Now set their working hours.`);
    else setError(r.error);
  };

  return (
    <Modal title={editing ? 'Edit doctor' : 'Add doctor'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input className={inputCls} value={form.doctorName} onChange={(e) => set({ doctorName: e.target.value })} placeholder="Dr. First Last" required /></Field>
        <Field label="Specialization"><input className={inputCls} value={form.specialization} onChange={(e) => set({ specialization: e.target.value })} placeholder="For example, Cardiology" required /></Field>
        <Field label="Department">
          <select className={inputCls} value={form.department} onChange={(e) => set({ department: e.target.value, clinic: '' })} required>
            <option value="">Choose a department</option>
            {catalog.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        </Field>
        {clinics.length > 0 && (
          <Field label="Clinic">
            <select className={inputCls} value={form.clinic} onChange={(e) => set({ clinic: e.target.value })} required>
              <option value="">Choose a clinic</option>
              {clinics.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Status" hint="Inactive doctors cannot be booked, but their history is kept.">
          <select className={inputCls} value={form.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn('secondary')} onClick={onClose}>Cancel</button>
          <button type="submit" className={btn('primary')} disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Add doctor'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Weekly working hours ----------
const DEFAULT_DAY = { enabled: true, start: '08:00', end: '16:00', slotMinutes: 60, maxPatients: 16 };

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

function perSlotHint(row) {
  const span = toMin(row.end) - toMin(row.start);
  const slots = Math.floor(span / Number(row.slotMinutes));
  if (!slots || slots < 1 || !Number(row.maxPatients)) return '';
  return `${slots} ${slots === 1 ? 'slot' : 'slots'}, about ${Math.ceil(Number(row.maxPatients) / slots)} per slot`;
}

export function ScheduleModal({ doctor, onClose, onSaved }) {
  const [rows, setRows] = useState(null);
  const [original, setOriginal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    staffApi(`/doctors/${doctor.id}/schedule`).then((r) => {
      if (!alive) return;
      if (!r.ok) { setError(r.error); setRows([]); return; }
      const byDay = Object.fromEntries(r.data.schedule.map((s) => [s.weekday, s]));
      const loaded = {};
      for (let d = 0; d <= 6; d++) {
        loaded[d] = byDay[d]
          ? { enabled: true, start: byDay[d].start, end: byDay[d].end, slotMinutes: byDay[d].slotMinutes, maxPatients: byDay[d].maxPatients }
          : { ...DEFAULT_DAY, enabled: false };
      }
      setRows(loaded);
      setOriginal(JSON.parse(JSON.stringify(loaded)));
    });
    return () => { alive = false; };
  }, [doctor.id]);

  const update = (day, patch) => setRows((r) => ({ ...r, [day]: { ...r[day], ...patch } }));

  const copyMondayToWeekdays = () => {
    setRows((r) => {
      const next = { ...r };
      [2, 3, 4, 5].forEach((d) => { next[d] = { ...r[1] }; });
      return next;
    });
  };

  const save = async () => {
    setBusy(true); setError('');
    const problems = [];
    let affected = 0;
    let changed = 0;

    for (const day of WEEK_ORDER) {
      const now = rows[day];
      const before = original[day];
      if (JSON.stringify(now) === JSON.stringify(before)) continue;
      changed++;
      const path = `/doctors/${doctor.id}/schedule/${day}`;
      if (now.enabled) {
        const r = await staffApi(path, { method: 'PUT', body: { start: now.start, end: now.end, slotMinutes: Number(now.slotMinutes), maxPatients: Number(now.maxPatients) } });
        if (r.ok) affected += r.data.affectedUpcoming; else problems.push(`${DAY_NAMES[day]}: ${r.error}`);
      } else if (before.enabled) {
        const r = await staffApi(path, { method: 'DELETE' });
        if (r.ok) affected += r.data.affectedUpcoming; else problems.push(`${DAY_NAMES[day]}: ${r.error}`);
      }
    }
    setBusy(false);

    if (problems.length) { setError(problems.join(' ')); return; }
    if (!changed) { onClose(); return; }
    const warn = affected > 0 ? ` ${affected} upcoming ${affected === 1 ? 'appointment falls' : 'appointments fall'} on a day you changed. They were not moved, so please review them under Appointments.` : '';
    onSaved(`Saved working hours for ${doctor.name}.${warn}`);
  };

  return (
    <Modal title={`Working hours: ${doctor.name}`} onClose={onClose} wide>
      {!rows ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Patients can only book inside these hours. The slot length splits the day into bookable times, and the daily limit caps how many patients are booked.
          </p>
          <div className="space-y-2">
            {WEEK_ORDER.map((day) => {
              const row = rows[day];
              return (
                <div key={day} className={`rounded-xl border p-3 ${row.enabled ? 'border-teal-300 bg-teal-50/40 dark:border-teal-800 dark:bg-teal-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <label className="flex w-32 shrink-0 items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" checked={row.enabled} onChange={(e) => update(day, { enabled: e.target.checked })} className="h-4 w-4 accent-teal-600" />
                      {DAY_NAMES[day]}
                    </label>
                    {row.enabled ? (
                      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Start<input type="time" className={inputCls} value={row.start} onChange={(e) => update(day, { start: e.target.value })} /></label>
                        <label className="text-xs text-slate-500 dark:text-slate-400">End<input type="time" className={inputCls} value={row.end} onChange={(e) => update(day, { end: e.target.value })} /></label>
                        <label className="text-xs text-slate-500 dark:text-slate-400">Slot (minutes)<input type="number" min="10" max="240" step="5" className={inputCls} value={row.slotMinutes} onChange={(e) => update(day, { slotMinutes: e.target.value })} /></label>
                        <label className="text-xs text-slate-500 dark:text-slate-400">Patients per day<input type="number" min="1" max="500" className={inputCls} value={row.maxPatients} onChange={(e) => update(day, { maxPatients: e.target.value })} /></label>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">Not working</span>
                    )}
                  </div>
                  {row.enabled && <p className="mt-1.5 pl-0 text-xs text-slate-500 sm:pl-36 dark:text-slate-400">{perSlotHint(row)}</p>}
                </div>
              );
            })}
          </div>
          <button type="button" className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400" onClick={copyMondayToWeekdays}>
            Copy Monday&apos;s hours to Tuesday-Friday
          </button>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button type="button" className={btn('secondary')} onClick={onClose}>Cancel</button>
            <button type="button" className={btn('primary')} onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save working hours'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
