import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does Trooper work?',
    a: (
      <ol className="list-inside list-decimal space-y-1">
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
    a: 'Yes. A confirmation text is queued the moment you book, and a reminder is queued before your visit. In this demo the texts are written to the server log. Connecting an SMS provider turns on real messages.',
  },
  {
    q: 'Can I check or cancel my appointment?',
    a: 'Yes. Choose Manage Appointment and enter your reference code and the mobile number you booked with. If you cancel, the slot is released for other patients and any pending reminders are dropped.',
  },
  {
    q: 'Who can make appointments?',
    a: (
      <ol className="list-inside list-decimal space-y-1">
        <li><strong>Veterans:</strong> give your name or Veteran ID.</li>
        <li><strong>Beneficiaries:</strong> give the beneficiary&apos;s name.</li>
        <li><strong>Civilians:</strong> give your name. Fees may apply for some services.</li>
      </ol>
    ),
  },
  {
    q: 'Where is the demo hospital and when is it open?',
    a: 'Veterans Memorial Medical Center, North Ave, Diliman, Quezon City, Metro Manila. Monday to Sunday, 8:00 AM to 5:00 PM.',
  },
];

export function FAQ() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section
      id="FAQ"
      className="border-t border-slate-200 bg-slate-50 px-4 py-20 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3" id="faqAccordion">
          {FAQS.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <h3 className="m-0">
                  <button
                    type="button"
                    id={`faq-btn-${index}`}
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${index}`}
                    className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left text-sm font-bold text-slate-800 transition hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                        open ? 'rotate-180 text-teal-600 dark:text-teal-400' : 'text-slate-400'
                      }`}
                    />
                  </button>
                </h3>
                {/* grid-rows 0fr -> 1fr animates the height without measuring it */}
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-btn-${index}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600 sm:text-sm dark:border-slate-700 dark:text-slate-300">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
