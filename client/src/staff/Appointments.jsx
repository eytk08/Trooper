import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, CalendarClock, Ban, Trash2 } from 'lucide-react';
import { staffApi } from './api';
import { Card, Badge, ErrorNote, ConfirmDialog, inputCls, btn, iconBtn } from './ui';
import { NewAppointmentModal, EditAppointmentModal, RescheduleModal } from './AppointmentModals';
import { fmtDate, fmtTime, todayYmd } from './format';

const PAGE_SIZE = 25;
const classLabel = { veteran: 'Veteran', beneficiary: 'Beneficiary', civilian: 'Civilian' };

function yesterdayYmd() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
}

export function Appointments({ doctors, notify }) {
  const [filters, setFilters] = useState({ when: 'upcoming', status: '', doctorId: '', date: '' });
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ appointments: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null); // { type: 'new' | 'edit' | 'reschedule' | 'cancel' | 'delete', appt? }
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  // Wait for a pause in typing before searching
  useEffect(() => {
    const id = setTimeout(() => { setQ(qInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [qInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) p.set('q', q);
    if (filters.status) p.set('status', filters.status);
    if (filters.doctorId) p.set('doctorId', filters.doctorId);
    if (filters.date) {
      p.set('date', filters.date);
    } else if (filters.when === 'upcoming') {
      p.set('from', todayYmd());
    } else if (filters.when === 'past') {
      p.set('to', yesterdayYmd());
      p.set('order', 'desc');
    } else {
      p.set('order', 'desc');
    }
    const r = await staffApi(`/appointments?${p}`);
    setLoading(false);
    if (r.ok) { setData(r.data); setError(''); }
    else if (r.status !== 401) setError(r.error);
  }, [page, q, filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (patch) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };
  const closeDialog = () => { setDialog(null); setDialogError(''); setBusy(false); };
  const saved = (message) => { closeDialog(); notify(message); load(); };

  const runAction = async (path, options, okMessage) => {
    setBusy(true); setDialogError('');
    const r = await staffApi(path, options);
    setBusy(false);
    if (r.ok) saved(okMessage);
    else setDialogError(r.error);
  };

  const { appointments, total } = data;
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Search, book, change and cancel patient appointments.</p>
        </div>
        <button type="button" className={btn('primary')} onClick={() => setDialog({ type: 'new' })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New appointment
        </button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input className={`${inputCls} pl-9`} placeholder="Search name, phone or reference" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search appointments" />
          </div>
          <select className={inputCls} value={filters.when} onChange={(e) => setFilter({ when: e.target.value, date: '' })} aria-label="When" disabled={!!filters.date}>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All dates</option>
          </select>
          <select className={inputCls} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} aria-label="Status">
            <option value="">Any status</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className={inputCls} value={filters.doctorId} onChange={(e) => setFilter({ doctorId: e.target.value })} aria-label="Doctor">
            <option value="">Any doctor</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.status === 'inactive' ? ' (inactive)' : ''}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            Specific date
            <input type="date" className={`${inputCls} w-auto`} value={filters.date} onChange={(e) => setFilter({ date: e.target.value })} />
          </label>
          {filters.date && <button type="button" className="font-semibold text-teal-700 hover:underline dark:text-teal-400" onClick={() => setFilter({ date: '' })}>Clear date</button>}
        </div>
      </Card>

      <ErrorNote>{error}</ErrorNote>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Patient</th>
                <th className="px-3 py-3">Doctor</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments.map((a) => {
                const cancelled = a.status === 'cancelled';
                return (
                  <tr key={a.id} className={cancelled ? 'opacity-70' : ''}>
                    <td className="whitespace-nowrap px-4 py-3"><span className="font-semibold">{fmtDate(a.date)}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{fmtTime(a.start)}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{a.reference}</td>
                    <td className="px-3 py-3">{a.patientName}<span className="block text-xs text-slate-500 dark:text-slate-400">{a.phone} &middot; {classLabel[a.patientClass]}</span></td>
                    <td className="px-3 py-3">{a.doctor}<span className="block text-xs text-slate-500 dark:text-slate-400">{a.clinic || a.department}</span></td>
                    <td className="px-3 py-3"><Badge kind={cancelled ? 'gray' : 'green'}>{a.status}</Badge></td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button type="button" className={iconBtn} title="Edit details" aria-label={`Edit ${a.reference}`} onClick={() => setDialog({ type: 'edit', appt: a })}><Pencil className="h-4 w-4" /></button>
                      <button type="button" className={iconBtn} title="Reschedule" aria-label={`Reschedule ${a.reference}`} disabled={cancelled} onClick={() => setDialog({ type: 'reschedule', appt: a })}><CalendarClock className="h-4 w-4" /></button>
                      <button type="button" className={iconBtn} title="Cancel appointment" aria-label={`Cancel ${a.reference}`} disabled={cancelled} onClick={() => setDialog({ type: 'cancel', appt: a })}><Ban className="h-4 w-4" /></button>
                      <button type="button" className={`${iconBtn} hover:!text-red-600`} title="Delete record" aria-label={`Delete ${a.reference}`} onClick={() => setDialog({ type: 'delete', appt: a })}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {!appointments.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">{loading ? 'Loading...' : 'No appointments match these filters.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">{total ? `Showing ${from}-${to} of ${total}` : '0 results'}</span>
          <div className="flex gap-2">
            <button type="button" className={btn('secondary')} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <button type="button" className={btn('secondary')} disabled={to >= total || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </Card>

      {dialog?.type === 'new' && <NewAppointmentModal doctors={doctors} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'edit' && <EditAppointmentModal appt={dialog.appt} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'reschedule' && <RescheduleModal appt={dialog.appt} doctors={doctors} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'cancel' && (
        <ConfirmDialog
          title="Cancel this appointment?"
          message={`${dialog.appt.patientName}, ${fmtDate(dialog.appt.date, true)} at ${fmtTime(dialog.appt.start)}. The slot is released for other patients and a cancellation text is queued. The record stays in the list.`}
          confirmLabel="Cancel appointment"
          busy={busy}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() => runAction(`/appointments/${dialog.appt.id}/cancel`, { method: 'POST' }, `Cancelled ${dialog.appt.reference}`)}
        />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title="Delete this record?"
          message={`This permanently removes ${dialog.appt.reference} (${dialog.appt.patientName}) and its messages. It cannot be undone. If the patient is simply not coming, cancel the appointment instead so the history is kept.`}
          confirmLabel="Delete permanently"
          busy={busy}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() => runAction(`/appointments/${dialog.appt.id}`, { method: 'DELETE' }, `Deleted ${dialog.appt.reference}`)}
        />
      )}
    </div>
  );
}
