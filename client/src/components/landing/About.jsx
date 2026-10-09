import React from 'react';

export function About() {
  return (
    <section
      id="About"
      className="border-t border-slate-200 bg-white px-4 py-20 text-center transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">About Trooper</h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
          Trooper is a chatbot and scheduling system that takes over the routine work of booking hospital appointments. It started as MedSched, a proposed scheduling system for the Veterans Memorial Medical Center, and was rebuilt around a MySQL database so that availability, booking, reminders and cancellations run without staff involvement.
        </p>
        <p className="pt-2 font-mono text-xs text-slate-400 dark:text-slate-500">
          Built with React, Vite, Tailwind CSS, Node.js, Express and MySQL. The hospital details in this demo are public information used as an example.
        </p>
      </div>
    </section>
  );
}
