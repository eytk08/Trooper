import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import botLogo from '../../assets/botLogo.png';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#services', label: 'Services' },
  { href: '#FAQ', label: 'FAQs' },
  { href: '#land', label: 'Schedule' },
];

const linkClass =
  'text-slate-600 transition-colors hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400';

export function Navbar({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-teal-200 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <a className="group flex items-center gap-3 no-underline" href="#page-top" onClick={close}>
          <img
            className="h-10 w-10 rounded-full object-cover ring-2 ring-teal-500/30 transition group-hover:ring-teal-500"
            src={botLogo}
            alt=""
          />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Trooper</span>
        </a>

        {/* Desktop links */}
        <ul className="m-0 hidden list-none items-center gap-7 p-0 text-sm font-semibold md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a className={linkClass} href={l.href}>
                {l.label}
              </a>
            </li>
          ))}

          {/* Staff Dashboard Entry with Subtle Demo Tag */}
          <li>
            <a
              href="/staff/"
              title="Reviewer & staff management portal preview"
              className="group inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100/80 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-teal-500/50 hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-400/50 dark:hover:bg-slate-800"
            >
              <span>Dashboard</span>
              <span className="rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 transition group-hover:bg-teal-500/25 dark:bg-teal-400/15 dark:text-teal-300">
                Demo
              </span>
            </a>
          </li>

          <li>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </li>
        </ul>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-700 transition active:scale-95 dark:border-slate-700 dark:text-slate-200"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <ul
          id="mobile-menu"
          className="m-0 list-none space-y-1 border-t border-slate-200 bg-white px-4 py-3 text-sm font-semibold md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          {LINKS.map((l) => (
            <li key={l.href}>
              <a className={`block rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-900 ${linkClass}`} href={l.href} onClick={close}>
                {l.label}
              </a>
            </li>
          ))}
          <li className="pt-1">
            <a
              href="/staff/"
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-center text-xs font-bold text-slate-800 transition active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span>Dashboard</span>
              <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-teal-700 dark:bg-teal-400/20 dark:text-teal-300">
                Demo
              </span>
            </a>
          </li>
        </ul>
      )}
    </nav>
  );
}