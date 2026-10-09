import React, { useState, useCallback } from 'react';
import { useTrooperChat } from './components/chat/useTrooperChat';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/landing/Navbar';
import { Chatbot } from './components/landing/Chatbot';
import { Problem } from './components/landing/Problem';
import { HowItWorks } from './components/landing/HowItWorks';
import { Features } from './components/landing/Features';
import { Audience } from './components/landing/Audience';
import { Services } from './components/landing/Services';
import { Automation } from './components/landing/Automation';
import { About } from './components/landing/About';
import { FAQ } from './components/landing/FAQ';
import { FinalCTA } from './components/landing/FinalCTA';
import { Footer } from './components/landing/Footer';

// Page funnel, top to bottom:
//   Hero (awareness) -> Problem -> How it works -> Features -> Audience/trust ->
//   Services -> Under the hood -> About -> FAQ (objections) -> Final call to action
export default function App() {
  const { theme, toggle } = useTheme();
  // One chat instance for the whole page: the hero chat and the Services section share
  // the same /api/config data, so the menu and the services list always agree.
  const chatState = useTrooperChat();
  const [chatOpen, setChatOpen] = useState(false);

  // Every call to action on the page opens the same chat (and starts it the first time)
  const startChat = useCallback(() => {
    setChatOpen(true);
    chatState.openChat();
  }, [chatState]);

  const toggleChat = useCallback(() => {
    if (chatOpen) setChatOpen(false);
    else startChat();
  }, [chatOpen, startChat]);

  return (
    <div
      id="page-top"
      className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-200 selection:bg-teal-500 selection:text-white dark:bg-slate-950 dark:text-slate-100"
    >
      <Navbar theme={theme} onToggleTheme={toggle} />
      <Chatbot chatState={chatState} isOpen={chatOpen} onToggle={toggleChat} />
      <Problem />
      <Features />     
      <HowItWorks onStart={startChat} />
      <Audience />
      <Automation />
      <About />
      <FinalCTA onStart={startChat} />
      <Footer />
    </div>
  );
}
