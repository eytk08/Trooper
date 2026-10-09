import React from 'react';
import { useTrooperChat } from './components/chat/useTrooperChat';
import { Navbar } from './components/landing/Navbar';
import { Chatbot } from './components/landing/Chatbot';
import { Automation } from './components/landing/Automation';
import { About } from './components/landing/About';
import { Services } from './components/landing/Services';
import { FAQ } from './components/landing/FAQ';
import { Footer } from './components/landing/Footer';

export default function App() {
  const chatState = useTrooperChat();

  return (
    <div id="page-top" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar />
      <Chatbot chatState={chatState} />
      <Automation />
      <About />
      <Services />
      <FAQ />
      <Footer />
    </div>
  );
}