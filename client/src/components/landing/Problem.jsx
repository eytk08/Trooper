import React from 'react';
import { PhoneOff, ClipboardList, BellOff } from 'lucide-react';

const PROBLEMS = [
  {
    icon: PhoneOff,
    pain: 'Long calls and busy lines',
    fix: 'Book any time, with no waiting on hold. Trooper answers right away, day or night.',
  },
  {
    icon: ClipboardList,
    pain: 'Confusing forms and too many choices',
    fix: 'Trooper asks one simple question at a time and only shows the times that are really open.',
  },
  {
    icon: BellOff,
    pain: 'Forgotten or missed visits',
    fix: 'You get a reference code and a confirmation text, and a reminder is sent before your visit.',
  },
];

export function Problem() {
  return (
    <section
      id="problem"
      className="border-t border-slate-200 bg-white px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Booking should not be the hard part of getting care.
          </h2>
          <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
            For many seniors and veterans, the hardest part of a check-up is arranging it. Trooper replaces the phone queue and the paperwork with a calm, step-by-step conversation that never rushes you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, pain, fix }) => (
            <div
              key={pain}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <Icon className="mb-4 h-7 w-7 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-500 line-through decoration-slate-400/60 dark:text-slate-400">
                {pain}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-200">
                <span className="font-semibold text-teal-700 dark:text-teal-400">With Trooper: </span>
                {fix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
