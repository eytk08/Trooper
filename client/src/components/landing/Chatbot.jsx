import React, { useEffect, useRef } from 'react';
import { ChatWidget } from '../chat/ChatWidget';
import startBtnImg from '../../assets/START_BTN.png';

export function Chatbot({ chatState, isOpen, onToggle }) {
  const sectionRef = useRef(null);
  const chatColRef = useRef(null);

  // Whenever the chat opens (hero button or any call to action further down the page),
  // bring it into view: the chat itself on phones, the hero on larger screens.
  useEffect(() => {
    if (!isOpen) return undefined;
    const isPhone = window.matchMedia('(max-width: 767px)').matches;
    const target = isPhone ? chatColRef.current : sectionRef.current;
    const id = setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => clearTimeout(id);
  }, [isOpen]);

  const hospitalName = chatState.config?.hospital?.name;

  return (
    <section
      id="land"
      ref={sectionRef}
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-teal-950 via-teal-800 to-teal-900 px-4 py-10 text-white transition-colors duration-200 sm:px-8 dark:from-slate-950 dark:via-teal-950 dark:to-slate-900"
    >
      {/* Closed: one full-width column (text only). Open: the second column grows in from 0fr,
          so the hero text eases left while the chat glides in from the right. */}
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-y-10 transition-[grid-template-columns,column-gap] duration-700 ease-trooper motion-reduce:transition-none grid-cols-1 ${
          isOpen ? 'md:grid-cols-[1fr_1.1fr] md:gap-x-14' : 'md:grid-cols-[1fr_0fr] md:gap-x-0'
        }`}
      >
        {/* Hero text */}
        <div className="mx-auto flex min-w-0 max-w-2xl flex-col items-center space-y-5 text-center">
          <span className="rounded-full border border-teal-200/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-100">
            Trooper &middot; Appointment guide
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Hospital Appointments,<br></br>One Click at a Time.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-teal-50/90 sm:text-lg">
            Trooper is a friendly guide that walks you through your appointment, one question at a time.<br></br> No forms, no phone queues, no app to download. Just answer, tap, and you are booked in about a minute.
          </p>

          <button
            id="init"
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls="trooper-chat"
            aria-label="Open or close the Trooper chat"
            className="cursor-pointer pt-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-900 active:scale-95"
          >
            <img src={startBtnImg} alt="Start chat" className="h-auto w-48 drop-shadow-lg sm:w-52" />
          </button>

          <p className="text-xs text-teal-100/70">
            Available in English and Filipino.
           
          </p>
        </div>

        {/* Chat. Always mounted so the conversation survives closing and reopening. */}
        <div
          id="trooper-chat"
          ref={chatColRef}
          aria-hidden={!isOpen}
          inert={!isOpen}
          className={`flex min-w-0 items-center justify-center overflow-hidden transition-all duration-700 ease-trooper motion-reduce:transition-none ${
            isOpen
              ? 'max-h-[900px] translate-x-0 scale-100 opacity-100'
              : 'pointer-events-none max-h-0 translate-x-8 scale-95 opacity-0 md:max-h-[900px]'
          }`}
        >
          <ChatWidget chatState={chatState} onClose={() => setIsOpen(false)} />
        </div>
      </div>
    </section>
  );
}
