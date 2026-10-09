import React from 'react';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  { n: 1, title: 'Say hello', text: 'Choose English or Filipino, then tap Schedule Appointment.' },
  { n: 2, title: 'Answer a few questions', text: 'Who the patient is, which clinic, and which time works best. Mostly just taps.' },
  { n: 3, title: 'You are booked', text: 'Keep your reference code. A confirmation text is on its way to your phone.' },
];

export function HowItWorks({ onStart }) {
  return (
    <section
      id="how-it-works"
      className="border-t border-slate-200 bg-slate-50 px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Three easy steps. About one minute.
          </h2>
          <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
            No account to create and nothing to download. You can start over at any point.
          </p>
        </div>

        <ol className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-xl font-extrabold text-white">
                {s.n}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-600 px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-teal-700 active:scale-95"
          >
            Try it now <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
