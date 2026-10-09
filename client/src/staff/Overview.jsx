import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { staffApi } from './api';
import { Card, Badge, ErrorNote, btn } from './ui';
import { fmtDate, fmtTime } from './format';

const statusKind = { confirmed: 'green', cancelled: 'gray', queued: 'amber', sent: 'green', failed: 'red', skipped: 'gray' };

function Stat({ label, value, tone }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${tone || 'text-slate-900 dark:text-white'}`}>{value ?? '-'}</p>
    </Card>
  );
}

function Bars({ list, labelKey, empty }) {
  if (!list.length) return <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>;
  const max = Math.max(...list.map((x) => x.booked));
  return (
    <ul className="m-0 list-none space-y-2.5 p-0">
      {list.map((x) => (
        <li key={x[labelKey]} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-slate-700 dark:text-slate-200">{x[labelKey]}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${(x.booked / max) * 100}%` }} />
          </div>
          <span className="w-6 text-right font-semibold text-slate-700 dark:text-slate-200">{x.booked}</span>
        </li>
      ))}
    </ul>
  );
}

export function Overview({ onOpenAppointments }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await staffApi('/summary');
    setLoading(false);
    if (r.ok) { setData(r.data); setError(''); }
    else if (r.status !== 401) setError(r.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = data?.notifications.counts || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
          {data && <p className="text-sm text-slate-500 dark:text-slate-400">Today is {fmtDate(data.today, true)}</p>}
        </div>
        <button type="button" onClick={load} disabled={loading} className={btn('secondary')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Today" value={data?.stats.today} tone="text-teal-700 dark:text-teal-300" />
        <Stat label="Upcoming" value={data?.stats.upcoming} />
        <Stat label="Cancelled" value={data?.stats.cancelled} />
        <Stat label="All records" value={data?.stats.total} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <h2 className="font-bold">Today&apos;s appointments</h2>
            <button type="button" onClick={onOpenAppointments} className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
              Manage all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr><th className="px-5 py-2.5">Time</th><th className="px-3 py-2.5">Patient</th><th className="px-3 py-2.5">Doctor</th><th className="px-3 py-2.5">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.todayList.length ? data.todayList.map((a) => (
                  <tr key={a.reference}>
                    <td className="whitespace-nowrap px-5 py-2.5 font-semibold">{fmtTime(a.start.slice(0, 5))}</td>
                    <td className="px-3 py-2.5">{a.patient} <span className="text-slate-400">({a.class})</span></td>
                    <td className="px-3 py-2.5">{a.doctor}<span className="block text-xs text-slate-500 dark:text-slate-400">{a.clinic || a.department}</span></td>
                    <td className="px-3 py-2.5"><Badge kind={statusKind[a.status]}>{a.status}</Badge></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">{loading ? 'Loading...' : 'No appointments today.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-bold">Reminder queue</h2>
          <div className="flex flex-wrap gap-2">
            {['queued', 'sent', 'failed', 'skipped'].map((s) => (
              <Badge key={s} kind={statusKind[s]}>{s}: {counts[s] || 0}</Badge>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Confirmations, reminders and cancellation texts are sent automatically.</p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-bold">Upcoming by department</h2>
          <Bars list={data?.byDepartment || []} labelKey="department" empty="No bookings yet." />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold">Busiest doctors (next 7 days)</h2>
          <Bars list={data?.doctorLoad || []} labelKey="doctor" empty="No bookings this week." />
        </Card>
      </div>
    </div>
  );
}
