import { useEffect, useState } from 'react';
import { supabase } from './api.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <main className="centered">Chargement...</main>;
  }

  return session ? <DashboardPage session={session} /> : <LoginPage />;
}
