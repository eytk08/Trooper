import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import botLogo from '../assets/botLogo.png';
import { ThemeToggle } from '../components/landing/ThemeToggle';
import { signIn } from './api';
import { Card, Field, ErrorNote, inputCls, btn } from './ui';

export function Login({ notice, onSignedIn, theme, onToggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const r = await signIn(username.trim(), password);
    setBusy(false);
    if (r.ok) onSignedIn(r.data.user);
    else setError(r.error);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="mb-6 flex items-center gap-3">
        <img src={botLogo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-teal-500/30" />
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">Trooper Staff</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Appointments and doctor schedules</p>
        </div>
      </div>

      <Card className="w-full max-w-sm p-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <h2 className="text-lg font-bold">Sign in</h2>
          {notice && !error && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">{notice}</p>
          )}
          <ErrorNote>{error}</ErrorNote>

          <Field label="Username">
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          </Field>
          <Field label="Password">
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>

          <button type="submit" className={btn('primary', 'w-full py-2.5')} disabled={busy || !username || !password}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </Card>

      <p className="mt-4 max-w-sm text-center text-xs text-slate-500 dark:text-slate-400">
        Staff only. Patient records are shown after you sign in.
      </p>
      <a href="/" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the public site
      </a>
    </main>
  );
}
