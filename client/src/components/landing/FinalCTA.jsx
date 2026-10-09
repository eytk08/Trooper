import React from 'react';
import { ArrowRight } from 'lucide-react';

export function FinalCTA({ onStart }) {
  return (
    <section
      id="start"
      className="border-t border-slate-200 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 px-4 py-20 text-center text-white dark:border-slate-800 dark:from-slate-950 dark:via-teal-950 dark:to-slate-900"
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready when you are.</h2>
        <p className="text-base leading-relaxed text-teal-50/90 sm:text-lg">
          Booking takes about a minute, and you can start over at any point. There is no account to create and nothing to download.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-teal-900 shadow-lg transition hover:bg-teal-50 active:scale-95"
        >
          Book with Trooper <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="text-xs text-teal-100/70">Need help instead? Ask Trooper for the hospital&apos;s phone numbers.</p>
      </div>
    </section>
  );
}
