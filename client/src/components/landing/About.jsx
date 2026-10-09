import React from 'react';

export function About() {
  return (
    <section id="About" className="py-20 px-4 bg-slate-50 border-t border-slate-200 text-center">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About Trooper</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Trooper is a chatbot and scheduling system that takes over the routine work of booking hospital appointments. It started as MedSched, a proposed scheduling system for the Veterans Memorial Medical Center, and was rebuilt around a MySQL database so that availability, booking, reminders and cancellations run without staff involvement.
        </p>
        <p className="text-xs text-slate-400 font-mono pt-2">
          Built with React, Vite, Tailwind CSS, Node.js, Express and MySQL. The hospital details in this demo are public information used as an example.
        </p>
      </div>
    </section>
  );
}