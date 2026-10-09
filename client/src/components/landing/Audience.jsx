import React from 'react';
import { Heart, Users } from 'lucide-react';

export function Audience() {
  return (
    <section
      id="families"
      className="border-t border-slate-200 bg-slate-50 px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Book for a parent, a grandparent or a fellow veteran.
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            A family member or caregiver can book on someone&apos;s behalf. Enter the patient&apos;s name and a mobile number that should receive the reminder. Anyone with the reference code and that number can check or cancel later.
          </p>
        </div>

        <ul className="m-0 list-none space-y-4 p-0">
          {[
            { icon: Heart, title: 'Veterans', text: 'Give your name or Veteran ID.' },
            { icon: Users, title: 'Beneficiaries', text: 'Give the beneficiary\u2019s name.' },
            { icon: Users, title: 'Civilians', text: 'Give your name. Fees may apply for some services.' },
          ].map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <Icon className="mt-0.5 h-6 w-6 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
