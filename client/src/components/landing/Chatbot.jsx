import React, { useState, useRef } from 'react';
import { ChatWidget } from '../chat/ChatWidget';
import startBtnImg from '../../assets/START_BTN.png';

export function Chatbot({ chatState }) {
  const [isOpen, setIsOpen] = useState(false);
  const chatContainerRef = useRef(null);

  const handleStartChat = () => {
    setIsOpen(true);
    if (chatState && chatState.handleAction) {
      chatState.handleAction('START_BOOKING');
    }
  };

  return (
    <section 
      id="land" 
      className="bg-gradient-to-br from-teal-950 via-teal-800 to-teal-900 min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-8 text-white transition-all duration-700 ease-in-out overflow-hidden"
    >       
      <div 
        className={`w-full max-w-7xl mx-auto transition-all duration-700 ease-in-out ${
          isOpen 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center' 
            : 'flex flex-col items-center justify-center max-w-3xl'
        }`}
      >
        {/* Left Column / Hero Content */}
        <div 
          className={`flex flex-col space-y-5 transition-all duration-700 ease-in-out ${
            isOpen 
              ? 'items-center md:items-start text-center md:text-left' 
              : 'items-center text-center'
          }`}
        >
          <h1 className="font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white transition-all duration-500">
            Trooper
          </h1>
          
          <h5 className="font-semibold text-xl sm:text-2xl text-teal-100 transition-all duration-500">
            Hospital appointments, handled automatically.
          </h5>
          
          <p className="text-teal-50/85 text-sm sm:text-base leading-relaxed max-w-xl transition-all duration-500">
            Chat with Trooper to book, check or cancel an appointment in about a minute. Open times, confirmations and reminders are taken care of for you.
          </p>
          
          {/* Trigger Button */}
          <button 
            id="init" 
            type="button"
            onClick={handleStartChat}
            aria-label="Open or close the Trooper chat"
            className="pt-2 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          >
            <img 
              src={startBtnImg} 
              alt="Start chat" 
              className="w-48 sm:w-52 h-auto drop-shadow-lg" 
            />
          </button>
          

        </div>

        {/* Right Column: Embedded Chatbot */}
        <div 
          ref={chatContainerRef} 
          className={`transition-all duration-700 ease-out flex justify-center items-center ${
            isOpen 
              ? 'opacity-100 scale-100 translate-x-0 max-h-[900px] visible' 
              : 'opacity-0 scale-95 translate-x-8 max-h-0 md:max-h-none pointer-events-none invisible hidden md:block md:w-0'
          }`}
        >
          {isOpen && <ChatWidget chatState={chatState} onClose={() => setIsOpen(false)} />}
        </div>
      </div>
    </section>
  );
}