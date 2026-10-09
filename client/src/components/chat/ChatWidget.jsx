import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X, Send } from 'lucide-react';
import botLogo from '../../assets/botLogo.png';

const iconBtn =
  'p-2.5 rounded-xl transition cursor-pointer hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200';

export function ChatWidget({ chatState, onClose }) {
  const { messages, isTyping, ui, input, handleAction, handleUserInput } = chatState;
  const [inputVal, setInputVal] = useState('');
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll only the chat's own message list, never the page
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Put the cursor in the box whenever the bot is waiting for typed input
  useEffect(() => {
    if (input && !isTyping) inputRef.current?.focus({ preventScroll: true });
  }, [input, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;
    handleUserInput(inputVal);
    setInputVal('');
  };

  return (
    <div className="flex h-[min(750px,calc(100dvh-7rem))] min-h-[520px] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl lg:min-w-[26rem] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3.5">
          <img src={botLogo} alt="" className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-teal-500/20" />
          <div>
            <h2 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl dark:text-white">Trooper</h2>
            <span className="block text-xs font-semibold tracking-wide text-teal-600 sm:text-sm dark:text-teal-400">
              {ui.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <button type="button" onClick={() => handleAction('RESET')} className={iconBtn} title={ui.restart} aria-label={ui.restart}>
            <RefreshCw className="h-5 w-5" />
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className={iconBtn} title={ui.close} aria-label={ui.close}>
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6 dark:bg-slate-950"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-5 py-3.5 text-base leading-relaxed shadow-sm sm:text-lg ${
                m.sender === 'user'
                  ? 'rounded-br-sm bg-teal-600 font-medium text-white'
                  : m.variant === 'code'
                    ? 'select-all rounded-bl-sm border border-teal-300 bg-teal-50 font-mono text-xl font-bold tracking-widest text-teal-900 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-200'
                    : 'rounded-bl-sm border border-slate-200/90 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {m.text}
            </div>

            {m.options && (
              <div className="mt-3 flex w-full flex-wrap justify-center gap-2.5 px-2">
                {m.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAction(opt.action, opt.value)}
                    className="cursor-pointer rounded-full border border-teal-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-teal-800 shadow-sm transition hover:border-teal-600 hover:bg-teal-600 hover:text-white active:scale-95 sm:text-base dark:border-teal-700 dark:bg-slate-900 dark:text-teal-200 dark:hover:border-teal-500 dark:hover:bg-teal-600 dark:hover:text-white"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div
            role="status"
            aria-label={ui.typing}
            className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200/90 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:0.15s]"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:0.3s]"></span>
          </div>
        )}
      </div>

      {/* Input tray */}
      {input ? (
        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 gap-2.5 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={input.placeholder || ui.respond}
            inputMode={input.inputMode}
            autoComplete={input.autoComplete}
            maxLength={80}
            disabled={isTyping}
            aria-label={ui.respond}
            className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400"
          />
          <button
            type="submit"
            disabled={isTyping || !inputVal.trim()}
            aria-label={ui.send}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-teal-600 p-3.5 text-white shadow-sm transition hover:bg-teal-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-slate-200 bg-slate-100/70 px-4 py-3 text-center text-xs font-medium text-slate-500 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {ui.choose}
        </div>
      )}
    </div>
  );
}
