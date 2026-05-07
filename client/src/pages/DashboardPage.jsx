import { useEffect, useState } from 'react';
import { createCheckoutSession, fetchClients, fetchInvoices, supabase } from '../api.js';
import ClientsPage from './ClientsPage.jsx';
import CreateInvoicePage from './CreateInvoicePage.jsx';
import InvoiceList from '../components/InvoiceList.jsx';

export default function DashboardPage({ session }) {
  const [view, setView] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const isPaid = session.user.app_metadata?.subscription_status === 'active';

  async function loadInvoices() {
    setLoading(true);
    setMessage('');

    try {
      const [invoiceData, clientData] = await Promise.all([
        fetchInvoices(session.user.id),
        fetchClients(session.user.id)
      ]);
      setInvoices(invoiceData);
      setClients(clientData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleCheckout() {
    setMessage('');

    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleCreated(invoice) {
    setInvoices((current) => [invoice, ...current]);
    setView('dashboard');
  }

  function handleClientCreated(client) {
    setClients((current) => [...current, client].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>DevisPro</h1>
          <p>{isPaid ? 'Plan Pro' : `Plan gratuit: ${invoices.length}/3 devis`}</p>
        </div>
        <div className="topbar-actions">
          {!isPaid && (
            <button onClick={handleCheckout} className="secondary">
              Passer Pro
            </button>
          )}
          <button onClick={handleLogout} className="ghost">
            Deconnexion
          </button>
        </div>
      </header>

      <nav className="app-tabs">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
          Devis
        </button>
        <button className={view === 'clients' ? 'active' : ''} onClick={() => setView('clients')}>
          Clients
        </button>
      </nav>

      {message && <p className="alert">{message}</p>}

      {view === 'dashboard' ? (
        <section className="content">
          <div className="section-heading">
            <div>
              <h2>Mes devis</h2>
              <p>Retrouvez et exportez vos devis clients.</p>
            </div>
            <button onClick={() => setView('create')} className="primary">
              Creer un devis
            </button>
          </div>

          {loading ? <p>Chargement des devis...</p> : <InvoiceList invoices={invoices} />}
        </section>
      ) : view === 'clients' ? (
        <ClientsPage clients={clients} onCreated={handleClientCreated} />
      ) : (
        <CreateInvoicePage clients={clients} onCreated={handleCreated} onCancel={() => setView('dashboard')} />
      )}
    </main>
  );
}
