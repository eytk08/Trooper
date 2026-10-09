import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { session, setSignedOutHandler } from './api';
import { Login } from './Login';
import { Dashboard } from './Dashboard';

export default function StaffApp() {
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState(() => session.get()?.user || null);
  const [notice, setNotice] = useState('');

  const signOut = useCallback((message = '') => {
    session.clear();
    setNotice(typeof message === 'string' ? message : '');
    setUser(null);
  }, []);

  // Any API call that comes back 401 (session expired) lands here
  useEffect(() => {
    setSignedOutHandler(() => signOut('Your session has ended. Please sign in again.'));
  }, [signOut]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-200 selection:bg-teal-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {user ? (
        <Dashboard user={user} onSignOut={() => signOut()} theme={theme} onToggleTheme={toggle} />
      ) : (
        <Login notice={notice} onSignedIn={setUser} theme={theme} onToggleTheme={toggle} />
      )}
    </div>
  );
}
