import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Clock, Power, Trash2 } from 'lucide-react';
import { staffApi } from './api';
import { Card, Badge, ConfirmDialog, inputCls, btn, iconBtn } from './ui';
import { DoctorFormModal, ScheduleModal } from './DoctorModals';
import { DAY_SHORT, WEEK_ORDER } from './format';

function WorkingDays({ days }) {
  if (!days.length) return <span className="text-xs text-amber-700 dark:text-amber-400">No hours set</span>;
  return (
    <div className="flex gap-1" aria-label={`Works ${days.map((d) => DAY_SHORT[d]).join(', ')}`}>
      {WEEK_ORDER.map((d) => (
        <span
          key={d}
          title={DAY_SHORT[d]}
          className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
            days.includes(d) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          {DAY_SHORT[d][0]}
        </span>
      ))}
    </div>
  );
}

export function Doctors({ doctors, catalog, reload, notify }) {
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null); // { type: 'form' | 'schedule' | 'delete', doctor? }
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return doctors.filter((d) =>
      (!needle || d.name.toLowerCase().includes(needle) || d.specialization.toLowerCase().includes(needle)) &&
      (!department || d.department === department) &&
      (!status || d.status === status));
  }, [doctors, q, department, status]);

  const closeDialog = () => { setDialog(null); setDialogError(''); setBusy(false); };
  const saved = (message) => { closeDialog(); notify(message); reload(); };

  const toggleActive = async (d) => {
    const next = d.status === 'active' ? 'inactive' : 'active';
    const r = await staffApi(`/doctors/${d.id}`, {
      method: 'PUT',
      body: { doctorName: d.name, specialization: d.specialization, department: d.department, clinic: d.clinic, status: next },
    });
    if (r.ok) { notify(`${d.name} is now ${next}.`); reload(); } else notify(r.error, 'error');
  };

  const remove = async () => {
    setBusy(true); setDialogError('');
    const r = await staffApi(`/doctors/${dialog.doctor.id}`, { method: 'DELETE' });
    setBusy(false);
    if (r.ok) saved(`Deleted ${dialog.doctor.name}`);
    else setDialogError(r.error);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Doctors &amp; hours</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage doctors and the days and times patients can book them.</p>
        </div>
        <button type="button" className={btn('primary')} onClick={() => setDialog({ type: 'form' })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add doctor
        </button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input className={`${inputCls} pl-9`} placeholder="Search name or specialization" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search doctors" />
          </div>
          <select className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {catalog.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Doctor</th><th className="px-3 py-3">Department</th><th className="px-3 py-3">Works</th>
                <th className="px-3 py-3">Upcoming</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((d) => (
                <tr key={d.id} className={d.status === 'inactive' ? 'opacity-70' : ''}>
                  <td className="px-4 py-3"><span className="font-semibold">{d.name}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{d.specialization}</span></td>
                  <td className="px-3 py-3">{d.departmentName}{d.clinicName && <span className="block text-xs text-slate-500 dark:text-slate-400">{d.clinicName}</span>}</td>
                  <td className="px-3 py-3"><WorkingDays days={d.workingDays} /></td>
                  <td className="px-3 py-3 font-semibold">{d.upcoming}</td>
                  <td className="px-3 py-3"><Badge kind={d.status === 'active' ? 'green' : 'gray'}>{d.status}</Badge></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <button type="button" className={iconBtn} title="Working hours" aria-label={`Working hours for ${d.name}`} onClick={() => setDialog({ type: 'schedule', doctor: d })}><Clock className="h-4 w-4" /></button>
                    <button type="button" className={iconBtn} title="Edit doctor" aria-label={`Edit ${d.name}`} onClick={() => setDialog({ type: 'form', doctor: d })}><Pencil className="h-4 w-4" /></button>
                    <button type="button" className={iconBtn} title={d.status === 'active' ? 'Set inactive' : 'Set active'} aria-label={d.status === 'active' ? `Set ${d.name} inactive` : `Set ${d.name} active`} onClick={() => toggleActive(d)}><Power className="h-4 w-4" /></button>
                    <button type="button" className={`${iconBtn} hover:!text-red-600`} title="Delete doctor" aria-label={`Delete ${d.name}`} onClick={() => setDialog({ type: 'delete', doctor: d })}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">{doctors.length ? 'No doctors match these filters.' : 'Loading...'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {shown.length} of {doctors.length} doctors. Doctors with appointment records cannot be deleted. Set them to inactive instead.
        </p>
      </Card>

      {dialog?.type === 'form' && <DoctorFormModal doctor={dialog.doctor} catalog={catalog} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'schedule' && <ScheduleModal doctor={dialog.doctor} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title="Delete this doctor?"
          message={`${dialog.doctor.name} and their working hours will be removed. This cannot be undone. If they have appointment records, deletion is blocked and you should set them to inactive instead.`}
          confirmLabel="Delete doctor"
          busy={busy}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
