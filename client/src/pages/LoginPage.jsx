import { useState } from 'react';
import { supabase } from '../api.js';
import LegalPage from './LegalPage.jsx';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalPage, setLegalPage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const authAction =
      mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await authAction;

    if (error) {
      setMessage(error.message);
    } else if (mode === 'signup') {
      setMessage('Compte cree. Verifiez votre email si la confirmation est activee.');
    }

    setLoading(false);
  }

  if (legalPage) {
    return <LegalPage page={legalPage} onBack={() => setLegalPage(null)} />;
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>DevisPro</h1>
        <p>Connectez-vous pour gerer vos devis.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Connexion
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength="6"
              required
            />
          </label>

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Veuillez patienter...' : mode === 'login' ? 'Se connecter' : 'Creer un compte'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <footer className="auth-links">
          <button className="link-button" onClick={() => setLegalPage('legal')}>
            Mentions legales
          </button>
          <button className="link-button" onClick={() => setLegalPage('privacy')}>
            Confidentialite
          </button>
          <button className="link-button" onClick={() => setLegalPage('terms')}>
            Conditions
          </button>
        </footer>
      </section>
    </main>
  );
}
