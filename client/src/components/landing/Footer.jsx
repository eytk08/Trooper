import React from 'react';

export function Footer() {
  return (
    <footer id="footer" className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500 space-y-4">
      <ul className="flex justify-center gap-6 font-semibold list-none p-0 m-0">
        <li><a href="#Automation" className="hover:text-slate-900">Automation</a></li>
        <li><a href="#About" className="hover:text-slate-900">About</a></li>
        <li><a href="#FAQ" className="hover:text-slate-900">FAQs</a></li>
        <li><a href="#land" className="hover:text-slate-900">Schedule</a></li>
        <li><a href="/admin.html" className="hover:text-slate-900">Staff</a></li>
      </ul>
      <div className="font-extrabold text-sm text-slate-800 tracking-tight">Trooper</div>
      <p className="text-slate-400">&copy; 2026 Trooper. All rights reserved.</p>
    </footer>
  );
}