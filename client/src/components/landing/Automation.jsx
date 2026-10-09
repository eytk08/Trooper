import React from 'react';
import { 
  CalendarCheck, 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  RotateCcw, 
  BarChart3 
} from 'lucide-react';

export function Automation() {
  const automations = [
    {
      icon: <CalendarCheck className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-3" />,
      title: 'Live slot generation',
      desc: "Open times are built from each doctor's schedule in the database. Change a schedule and the chatbot shows the new times right away.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-3" />,
      title: 'No double booking',
      desc: 'Each booking is checked inside a database transaction, so ten people tapping the last slot at once still get only the places that exist.',
    },
    {
      icon: <UserCheck className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-3" />,
      title: 'Automatic doctor matching',
      desc: 'First time patients do not have to compare doctors. Trooper finds the earliest open time across the whole clinic and offers it.',
    },
    {
      icon: <Bell className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-3" />,
      title: 'Instant confirmation and reminders',
      desc: 'A reference code and a text message are created the moment a booking is made. A background job sends a reminder before the visit and retries failed messages.',
    },
    {
      icon: <RotateCcw className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-3" />,
      title: 'Self service changes',
      desc: 'Patients check or cancel with their reference code and mobile number. The slot is released and queued reminders are dropped automatically.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-3" />,
      title: 'Live staff dashboard',
      desc: "Staff see today's appointments, doctor workload, and the message log in one page, with no manual updating.",
      link: '/staff/',
    },
  ];

  return (
    <section id="Automation" className="border-t border-slate-200 bg-slate-50 px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Under the hood: what runs automatically</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">The engineering behind the simple conversation: live slot generation, transactional booking and a reminder queue, all backed by MySQL.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((a, i) => (
            <div 
              key={i} 
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:shadow-black/30"
            >
              <div>
                {a.icon}
                <h5 className="font-bold text-base text-slate-900 dark:text-white mb-2">{a.title}</h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a.desc}</p>
              </div>
              {a.link && (
                <a href={a.link} className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline mt-4 inline-block">
                  Open the dashboard &rarr;
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Workflow Sequence */}
        <div className="mt-14 p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-200">
          <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><b>1 CHAT</b> Patient picks a clinic</span>
          <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
          <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><b>2 CHECK</b> Open slots are generated</span>
          <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
          <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><b>3 BOOK</b> Saved in one transaction</span>
          <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
          <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><b>4 QUEUE</b> Messages are scheduled</span>
          <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
          <span className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"><b>5 SEND</b> Background job sends them</span>
        </div>
      </div>
    </section>
  );
}