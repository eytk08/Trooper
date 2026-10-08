import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FAQ() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'How does Trooper work?',
      a: (
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>Language:</strong> choose English or Filipino.</li>
          <li><strong>Menu:</strong> schedule an appointment, manage an existing one, ask a question, contact the hospital, or view records.</li>
          <li><strong>Guided steps:</strong> Trooper asks simple questions and shows only the times that are really open.</li>
          <li><strong>Saved at once:</strong> your booking goes straight into the hospital database. There is nothing to wait for.</li>
        </ol>
      ),
    },
    {
      q: 'How do I make an appointment?',
      a: 'Choose Schedule Appointment, tell Trooper who the patient is, give a mobile number, then pick the department and clinic. First time patients are offered the earliest open times automatically. Returning patients choose their doctor, date and time. You get a reference code when the booking is done.',
    },
    {
      q: 'Will I get a confirmation and a reminder?',
      a: 'Yes. A confirmation text is queued the moment you book, and a reminder is queued for the day before your visit. In this demo the texts are written to the server log. Connecting an SMS provider turns on real messages.',
    },
    {
      q: 'Can I check or cancel my appointment?',
      a: 'Yes. Choose Manage Appointment and enter your reference code and the mobile number you booked with. If you cancel, the slot is released for other patients and any pending reminders are dropped.',
    },
    {
      q: 'Who can make appointments?',
      a: (
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>Veterans:</strong> give your name or Veteran ID.</li>
          <li><strong>Beneficiaries:</strong> give the beneficiary\'s name.</li>
          <li><strong>Civilians:</strong> give your name. Fees may apply for some services.</li>
        </ol>
      ),
    },
    {
      q: 'Where is the demo hospital and when is it open?',
      a: 'Veterans Memorial Medical Center, North Ave, Diliman, Quezon City, Metro Manila. Monday to Sunday, 8:00 AM to 5:00 PM.',
    },
  ];

  return (
    <section id="FAQ" className="py-20 bg-slate-50 border-t border-slate-200 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-12">
          Frequently Asked Questions
        </h1>
        <div className="space-y-3" id="faqAccordion">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="w-full px-5 py-4 text-left flex justify-between items-center font-bold text-slate-800 text-sm hover:text-teal-700 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180 text-teal-600' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}