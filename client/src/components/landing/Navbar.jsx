import React from 'react';
import botLogo from '../../assets/botLogo.png';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <a className="flex items-center gap-3 no-underline group" href="#page-top">
          <img 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/30 group-hover:ring-teal-500 transition" 
            src={botLogo} 
            alt="Trooper Logo" 
          />
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white transition-colors">
            Trooper
          </span>
        </a>

        {/* Navigation Items */}
        <ul className="flex items-center gap-7 text-sm font-semibold list-none mb-0 p-0">
          <li>
            <a 
              className="text-slate-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" 
              href="#Automation"
            >
              Automation
            </a>
          </li>
          <li>
            <a 
              className="text-slate-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" 
              href="#About"
            >
              About
            </a>
          </li>
          <li>
            <a 
              className="text-slate-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" 
              href="#services"
            >
              Services
            </a>
          </li>
          <li>
            <a 
              className="text-slate-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" 
              href="#FAQ"
            >
              FAQs
            </a>
          </li>
          <li>
            <a 
              className="text-slate-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" 
              href="#land"
            >
              Schedule
            </a>
          </li>
          <li>
            <a 
              href="/admin.html" 
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Staff
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}