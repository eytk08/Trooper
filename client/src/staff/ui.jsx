import React, { useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

// ---------- Shared class names ----------
export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400';

const btnBase =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50';
const btnKinds = {
  primary: 'bg-teal-600 text-white shadow-sm hover:bg-teal-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
};
export const btn = (kind = 'primary', extra = '') => `${btnBase} ${btnKinds[kind]} ${extra}`;

export const iconBtn =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100';

// ---------- Small pieces ----------
const badgeKinds = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  gray: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
};
export function Badge({ kind = 'gray', children }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeKinds[kind]}`}>{children}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// ---------- Modal ----------
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // Focus the first field so keyboard users can start typing straight away
    ref.current?.querySelector('input, select, textarea, button')?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={iconBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// "Are you sure?" dialog for cancel and delete
export function ConfirmDialog({ title, message, confirmLabel, danger = true, busy, error, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{message}</p>
      <ErrorNote>{error}</ErrorNote>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={btn('secondary')} onClick={onClose} disabled={busy}>Keep it</button>
        <button type="button" className={btn(danger ? 'danger' : 'primary')} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Toasts ----------
export function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${t.kind === 'error' ? 'bg-red-600' : 'bg-teal-700'}`}
        >
          {t.kind === 'error' ? <AlertCircle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
