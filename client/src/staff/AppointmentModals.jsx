import React, { useState, useEffect } from 'react';
import { publicApi, staffApi } from './api';
import { Modal, Field, ErrorNote, inputCls, btn } from './ui';
import { fmtDate, fmtTime } from './format';

// ---------- Slot picker: the same open times patients see in the chatbot ----------
export function SlotPicker({ doctorId, value, onChange, reloadKey = 0, note }) {
  const [state, setState] = useState({ loading: false, dates: [], error: '' });

  useEffect(() => {
    if (!doctorId) { setState({ loading: false, dates: [], error: '' }); return undefined; }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    publicApi(`/doctors/${doctorId}/availability`).then((r) => {
      if (!alive) return;
      setState(r.ok ? { loading: false, dates: r.data.dates, error: '' } : { loading: false, dates: [], error: r.error });
    });
    return () => { alive = false; };
  }, [doctorId, reloadKey]);

  if (!doctorId) return <p className="text-sm text-slate-500 dark:text-slate-400">Choose a doctor to see open times.</p>;
  if (state.loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading open times...</p>;
  if (state.error) return <ErrorNote>{state.error}</ErrorNote>;
  if (!state.dates.length) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        This doctor has no open times in the booking window. Add or extend working hours in Doctors &amp; hours.
      </p>
    );
  }

  const day = state.dates.find((d) => d.date === value.date);
  return (
    <div className="space-y-3">
      <Field label="Date">
        <select className={inputCls} value={value.date} onChange={(e) => onChange({ date: e.target.value, start: '' })}>
          <option value="">Choose a date</option>
          {state.dates.map((d) => <option key={d.date} value={d.date}>{fmtDate(d.date, true)}</option>)}
        </select>
      </Field>
      {day && (
        <div>
          <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Time</span>
          <div className="flex flex-wrap gap-2">
            {day.slots.map((s) => (
              <button
                key={s.start}
                type="button"
                onClick={() => onChange({ date: value.date, start: s.start })}
                aria-pressed={value.start === s.start}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold transition active:scale-95 ${
                  value.start === s.start
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {fmtTime(s.start)}
              </button>
            ))}
          </div>
        </div>
      )}
      {note && <p className="text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}

const doctorLabel = (d) => `${d.name} (${d.clinicName || d.departmentName})`;

// ---------- Create ----------
export function NewAppointmentModal({ doctors, onClose, onSaved }) {
  const active = doctors.filter((d) => d.status === 'active');
  const [form, setForm] = useState({ doctorId: '', date: '', start: '', patientName: '', patientClass: 'civilian', phone: '', language: 'en', isNewPatient: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await staffApi('/appointments', { method: 'POST', body: { ...form, doctorId: Number(form.doctorId) } });
    setBusy(false);
    if (r.ok) { onSaved(`Booked ${r.data.reference}`); return; }
    setError(r.error);
    if (r.code === 'SLOT_UNAVAILABLE') { set({ start: '' }); setReloadKey((k) => k + 1); }
  };

  return (
    <Modal title="New appointment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Doctor">
          <select className={inputCls} value={form.doctorId} onChange={(e) => set({ doctorId: e.target.value, date: '', start: '' })} required>
            <option value="">Choose a doctor</option>
            {active.map((d) => <option key={d.id} value={d.id}>{doctorLabel(d)}</option>)}
          </select>
        </Field>
        <SlotPicker doctorId={form.doctorId} value={form} onChange={set} reloadKey={reloadKey} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient name"><input className={inputCls} value={form.patientName} onChange={(e) => set({ patientName: e.target.value })} required /></Field>
          <Field label="Mobile number" hint="For example 09171234567"><input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" required /></Field>
          <Field label="Patient type">
            <select className={inputCls} value={form.patientClass} onChange={(e) => set({ patientClass: e.target.value })}>
              <option value="veteran">Veteran</option><option value="beneficiary">Beneficiary</option><option value="civilian">Civilian</option>
            </select>
          </Field>
          <Field label="Message language">
            <select className={inputCls} value={form.language} onChange={(e) => set({ language: e.target.value })}>
              <option value="en">English</option><option value="fil">Filipino</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isNewPatient} onChange={(e) => set({ isNewPatient: e.target.checked })} className="h-4 w-4 accent-teal-600" />
          First visit to this hospital
        </label>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn('secondary')} onClick={onClose}>Cancel</button>
          <button type="submit" className={btn('primary')} disabled={busy || !form.doctorId || !form.date || !form.start}>{busy ? 'Booking...' : 'Book appointment'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Edit details ----------
export function EditAppointmentModal({ appt, onClose, onSaved }) {
  const [form, setForm] = useState({ patientName: appt.patientName, phone: appt.phone, patientClass: appt.patientClass, language: appt.language, isNewPatient: appt.isNewPatient });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await staffApi(`/appointments/${appt.id}`, { method: 'PATCH', body: form });
    setBusy(false);
    if (r.ok) onSaved(`Updated ${appt.reference}`);
    else setError(r.error);
  };

  return (
    <Modal title={`Edit details (${appt.reference})`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {fmtDate(appt.date, true)}, {fmtTime(appt.start)} with {appt.doctor}. To change the time, use Reschedule.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient name"><input className={inputCls} value={form.patientName} onChange={(e) => set({ patientName: e.target.value })} required /></Field>
          <Field label="Mobile number"><input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" required /></Field>
          <Field label="Patient type">
            <select className={inputCls} value={form.patientClass} onChange={(e) => set({ patientClass: e.target.value })}>
              <option value="veteran">Veteran</option><option value="beneficiary">Beneficiary</option><option value="civilian">Civilian</option>
            </select>
          </Field>
          <Field label="Message language">
            <select className={inputCls} value={form.language} onChange={(e) => set({ language: e.target.value })}>
              <option value="en">English</option><option value="fil">Filipino</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isNewPatient} onChange={(e) => set({ isNewPatient: e.target.checked })} className="h-4 w-4 accent-teal-600" />
          First visit to this hospital
        </label>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn('secondary')} onClick={onClose}>Cancel</button>
          <button type="submit" className={btn('primary')} disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Reschedule ----------
export function RescheduleModal({ appt, doctors, onClose, onSaved }) {
  const active = doctors.filter((d) => d.status === 'active' || d.id === appt.doctorId);
  const [doctorId, setDoctorId] = useState(String(appt.doctorId));
  const [slot, setSlot] = useState({ date: '', start: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await staffApi(`/appointments/${appt.id}/reschedule`, { method: 'POST', body: { doctorId: Number(doctorId), ...slot } });
    setBusy(false);
    if (r.ok) { onSaved(`Moved ${appt.reference} to ${fmtDate(r.data.date)}, ${fmtTime(r.data.start)}`); return; }
    setError(r.error);
    if (r.code === 'SLOT_UNAVAILABLE') { setSlot((s) => ({ ...s, start: '' })); setReloadKey((k) => k + 1); }
  };

  return (
    <Modal title={`Reschedule (${appt.reference})`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {appt.patientName} is booked with {appt.doctor} on {fmtDate(appt.date, true)} at {fmtTime(appt.start)}. The reference code stays the same, and a new confirmation text is queued.
        </p>
        <Field label="Doctor">
          <select className={inputCls} value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setSlot({ date: '', start: '' }); }}>
            {active.map((d) => <option key={d.id} value={d.id}>{doctorLabel(d)}</option>)}
          </select>
        </Field>
        <SlotPicker
          doctorId={doctorId}
          value={slot}
          onChange={setSlot}
          reloadKey={reloadKey}
          note={Number(doctorId) === appt.doctorId ? 'The current time is not listed because it is this appointment\u2019s own slot.' : undefined}
        />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn('secondary')} onClick={onClose}>Cancel</button>
          <button type="submit" className={btn('primary')} disabled={busy || !slot.date || !slot.start}>{busy ? 'Moving...' : 'Move appointment'}</button>
        </div>
      </form>
    </Modal>
  );
}
