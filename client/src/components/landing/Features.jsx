import React from 'react';
import { MessageCircle, Type, MousePointerClick, Languages, CalendarCheck, Bell, RotateCcw } from 'lucide-react';

const FEATURES = [
  { icon: MessageCircle, title: 'One question at a time', text: 'Trooper never shows a long form. It asks a single, simple question and waits for your answer.' },
  { icon: Type, title: 'Large, easy-to-read text', text: 'Big messages and big buttons, so everything is comfortable to read and easy to tap.' },
  { icon: MousePointerClick, title: 'Tap instead of type', text: 'Most steps are a single tap. You only type the patient name and a mobile number.' },
  { icon: Languages, title: 'English and Filipino', text: 'Pick your language at the start and Trooper stays in it all the way through, including your reminders.' },
  { icon: CalendarCheck, title: 'Only real, open times', text: 'You see the earliest available slots, so you never pick a time that is already taken.' },
  { icon: Bell, title: 'Nothing to remember', text: 'You get a reference code and a confirmation text, plus a reminder before your visit.' },
  { icon: RotateCcw, title: 'Change your mind anytime', text: 'Check or cancel with your reference code and mobile number. No phone call needed.' },
];

export function Features() {
  return (
    <section
      id="features"
      className="border-t border-slate-200 bg-white px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Made simple for seniors, veterans and their families.
          </h2>
          <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
            Every screen is designed to feel calm, clear and unhurried.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-emerald-100 p-6 transition duration-200 hover:border-slate-300 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
            >
              <Icon className="mb-3 h-7 w-7 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <h3 className="mb-2 text-base font-bold text-slate-900 sm:text-lg dark:text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
