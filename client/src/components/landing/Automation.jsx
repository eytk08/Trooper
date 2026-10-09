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
      icon: <CalendarCheck className="w-6 h-6 text-teal-600 mb-3" />,
      title: 'Live slot generation',
      desc: "Open times are built from each doctor's schedule in the database. Change a schedule and the chatbot shows the new times right away.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-600 mb-3" />,
      title: 'No double booking',
      desc: 'Each booking is checked inside a database transaction, so ten people tapping the last slot at once still get only the places that exist.',
    },
    {
      icon: <UserCheck className="w-6 h-6 text-teal-600 mb-3" />,
      title: 'Automatic doctor matching',
      desc: 'First time patients do not have to compare doctors. Trooper finds the earliest open time across the whole clinic and offers it.',
    },
    {
      icon: <Bell className="w-6 h-6 text-teal-600 mb-3" />,
      title: 'Instant confirmation and reminders',
      desc: 'A reference code and a text message are created the moment a booking is made. A background job sends a reminder before the visit and retries failed messages.',
    },
    {
      icon: <RotateCcw className="w-6 h-6 text-teal-600 mb-3" />,
      title: 'Self service changes',
      desc: 'Patients check or cancel with their reference code and mobile number. The slot is released and queued reminders are dropped automatically.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-teal-600 mb-3" />,
      title: 'Live staff dashboard',
      desc: "Staff see today's appointments, doctor workload, and the message log in one page, with no manual updating.",
      link: '/admin.html',
    },
  ];

  return (
    <section id="Automation" className="py-20 bg-white border-t border-slate-200 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">What Trooper automates</h2>
          <p className="text-sm sm:text-base text-slate-500">Every step that used to need a staff member, a phone call, or a paper list.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((a, i) => (
            <div 
              key={i} 
              className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-lg hover:border-slate-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                {a.icon}
                <h5 className="font-bold text-base text-slate-900 mb-2">{a.title}</h5>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{a.desc}</p>
              </div>
              {a.link && (
                <a href={a.link} className="text-xs font-semibold text-teal-700 hover:underline mt-4 inline-block">
                  Open the dashboard &rarr;
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Workflow Sequence */}
        <div className="mt-14 p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-slate-700">
          <span className="bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs"><b>1 CHAT</b> Patient picks a clinic</span>
          <span className="text-slate-400">&rarr;</span>
          <span className="bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs"><b>2 CHECK</b> Open slots are generated</span>
          <span className="text-slate-400">&rarr;</span>
          <span className="bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs"><b>3 BOOK</b> Saved in one transaction</span>
          <span className="text-slate-400">&rarr;</span>
          <span className="bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs"><b>4 QUEUE</b> Messages are scheduled</span>
          <span className="text-slate-400">&rarr;</span>
          <span className="bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs"><b>5 SEND</b> Background job sends them</span>
        </div>
      </div>
    </section>
  );
}