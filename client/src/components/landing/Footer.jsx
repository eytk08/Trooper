import React from 'react';

const link = 'transition-colors hover:text-teal-600 dark:hover:text-teal-400';

export function Footer() {
  return (
    <footer
      id="footer"
      className="space-y-4 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
    >
      <ul className="m-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0 px-4 font-semibold">
        <li><a href="#how-it-works" className={link}>How it works</a></li>
        <li><a href="#features" className={link}>Features</a></li>
        <li><a href="#Automation" className={link}>Under the hood</a></li>
        <li><a href="#About" className={link}>About</a></li>
        <li><a href="#services" className={link}>Services</a></li>
        <li><a href="#FAQ" className={link}>FAQs</a></li>
        <li><a href="#land" className={link}>Schedule</a></li>
        <li><a href="/staff/" className={link}>Staff</a></li>
      </ul>
      <div className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Trooper</div>
      <p className="text-slate-400 dark:text-slate-500">&copy; {new Date().getFullYear()} Trooper. All rights reserved.</p>
    </footer>
  );
}
