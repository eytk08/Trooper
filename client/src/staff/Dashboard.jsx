import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, CalendarDays, Stethoscope, LogOut } from 'lucide-react';
import botLogo from '../assets/botLogo.png';
import { ThemeToggle } from '../components/landing/ThemeToggle';
import { staffApi } from './api';
import { Toasts } from './ui';
import { Overview } from './Overview';
import { Appointments } from './Appointments';
import { Doctors } from './Doctors';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'doctors', label: 'Doctors & hours', icon: Stethoscope },
];

export default function Dashboard({ user, onSignOut, theme, onToggleTheme }) {
  const [tab, setTab] = useState(() => {
    const fromUrl = window.location.hash.slice(1);
    return TABS.some((t) => t.id === fromUrl) ? fromUrl : 'overview';
  });
  const [doctors, setDoctors] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const notify = useCallback((text, kind = 'ok') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);

  const goTo = (id) => {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  // Doctors and departments feed the dropdowns on every tab
  const reloadDoctors = useCallback(async () => {
    const r = await staffApi('/doctors');
    if (r.ok) setDoctors(r.data.doctors);
    else if (r.status !== 401) notify(r.error, 'error');
  }, [notify]);

  useEffect(() => {
    reloadDoctors();
    staffApi('/catalog').then((r) => r.ok && setCatalog(r.data.departments));
  }, [reloadDoctors]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href="#overview" onClick={() => goTo('overview')} className="flex items-center gap-2.5 no-underline">
            <img src={botLogo} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-teal-500/30" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Trooper <span className="font-semibold text-teal-600 dark:text-teal-400">Staff</span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
              Signed in as <strong className="text-slate-800 dark:text-slate-100">{user.username}</strong>
            </span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto overflow-hidden overflow-y-hidden px-4 sm:px-6" aria-label="Dashboard sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                tab === id
                  ? 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {tab === 'overview' && <Overview onOpenAppointments={() => goTo('appointments')} />}
        {tab === 'appointments' && <Appointments doctors={doctors} notify={notify} />}
        {tab === 'doctors' && <Doctors doctors={doctors} catalog={catalog} reload={reloadDoctors} notify={notify} />}
      </main>

      <Toasts toasts={toasts} />
    </div>
  );
}
