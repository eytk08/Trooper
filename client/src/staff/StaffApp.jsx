import React, { useState } from 'react';
import Dashboard from './Dashboard';
import { MOCK_STAFF_USER } from './mockData';

export default function StaffApp() {
  const [user, setUser] = useState(MOCK_STAFF_USER);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Dashboard user={user} onLogout={() => setUser(MOCK_STAFF_USER)} />
    </div>
  );
}