import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X, Send } from 'lucide-react';
import botLogo from "../../assets/botLogo.png";

export function ChatWidget({ isOpen, onClose, chatState }) {
  const { messages, step, isTyping, handleAction, handleUserInput } = chatState;
  const [inputVal, setInputVal] = useState('');
  const scrollContainerRef = useRef(null);

  // Scroll only the internal chat container
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleUserInput(inputVal);
    setInputVal('');
  };

  const showTextInput = 
    step === 'AWAITING_NAME' || 
    step === 'AWAITING_PHONE' || 
    step === 'AWAITING_REF' || 
    step === 'AWAITING_MANAGE_PHONE';

  return (
    <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col h-[750px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <img 
            src={botLogo} 
            alt="Trooper Avatar" 
            className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-teal-500/20"
          />
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">Trooper</h2>
            <span className="block text-xs sm:text-sm text-teal-600 font-semibold tracking-wide">
              Automated Scheduling Partner
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => handleAction('RESET')}
            className="p-2.5 hover:bg-slate-100 rounded-xl hover:text-slate-700 transition cursor-pointer"
            title="Restart conversation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 rounded-xl hover:text-slate-700 transition cursor-pointer"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Conversational bubble font size */}
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-base sm:text-lg leading-relaxed shadow-xs whitespace-pre-line ${
                m.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-br-xs font-medium'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>

            {/* Quick action buttons / pills — Centered with larger font */}
            {m.options && (
              <div className="w-full flex flex-wrap justify-center gap-2.5 mt-3 px-2">
                {m.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAction(opt.action, opt.value);
                    }}
                    className="px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold bg-white border border-teal-300 text-teal-800 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition shadow-xs cursor-pointer active:scale-95 text-center"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-2xl px-4 py-3 w-fit shadow-xs rounded-bl-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.3s]"></span>
          </div>
        )}
      </div>

      {/* Input Tray */}
      {showTextInput ? (
        <form onSubmit={handleSubmit} className="text-slate-900 p-4 bg-white border-t border-slate-200 flex gap-2.5 shrink-0">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your response..."
            autoFocus
            className="flex-1 rounded-full border border-slate-300 px-5 py-3 text-base focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-full p-3.5 transition flex items-center justify-center shrink-0 shadow-sm cursor-pointer active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <div className="px-4 py-3 bg-slate-100/70 border-t border-slate-200 text-xs sm:text-sm text-slate-500 text-center shrink-0 font-medium">
          Choose an option above to continue
        </div>
      )}
    </div>
  );
}