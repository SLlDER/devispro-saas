import { useEffect, useState } from 'react';
import {
  createCheckoutSession,
  createPortalSession,
  fetchClients,
  fetchInvoices,
  fetchInvoiceUsage,
  supabase
} from '../api.js';
import ClientsPage from './ClientsPage.jsx';
import CreateInvoicePage from './CreateInvoicePage.jsx';
import InvoiceList from '../components/InvoiceList.jsx';

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(price));
}

export default function DashboardPage({ session }) {
  const [view, setView] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [usage, setUsage] = useState({ created_count: 0, free_limit: 3 });
  const [filters, setFilters] = useState({ status: 'all', type: 'all', search: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const isPaid = session.user.app_metadata?.subscription_status === 'active';

  async function loadInvoices() {
    setLoading(true);
    setMessage('');

    try {
      const [invoiceData, clientData, usageData] = await Promise.all([
        fetchInvoices(session.user.id),
        fetchClients(session.user.id),
        fetchInvoiceUsage(session.user.id)
      ]);
      setInvoices(invoiceData);
      setClients(clientData);
      setUsage(usageData);
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

  async function handlePortal() {
    setMessage('');

    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleCreated(invoice) {
    setInvoices((current) => [invoice, ...current]);
    setUsage((current) => ({ ...current, created_count: current.created_count + 1 }));
    setView('dashboard');
  }

  function handleInvoiceChanged(invoice) {
    setInvoices((current) => current.map((item) => (item.id === invoice.id ? invoice : item)));
  }

  function handleInvoiceDeleted(id) {
    setInvoices((current) => current.filter((item) => item.id !== id));
  }

  function handleClientCreated(client) {
    setClients((current) => [...current, client].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleClientChanged(client) {
    setClients((current) => current.map((item) => (item.id === client.id ? client : item)));
  }

  function handleClientDeleted(id) {
    setClients((current) => current.filter((item) => item.id !== id));
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = filters.status === 'all' || invoice.status === filters.status;
    const matchesType = filters.type === 'all' || invoice.document_type === filters.type;
    const search = filters.search.trim().toLowerCase();
    const matchesSearch =
      !search ||
      invoice.client.toLowerCase().includes(search) ||
      invoice.description.toLowerCase().includes(search) ||
      invoice.document_number?.toLowerCase().includes(search);

    return matchesStatus && matchesType && matchesSearch;
  });

  const acceptedTotal = invoices
    .filter((invoice) => invoice.status === 'accepted')
    .reduce((sum, invoice) => sum + Number(invoice.price), 0);
  const pendingTotal = invoices
    .filter((invoice) => invoice.status !== 'accepted' && invoice.status !== 'refused')
    .reduce((sum, invoice) => sum + Number(invoice.price), 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>DevisPro</h1>
          <p>
            {isPaid
              ? 'Plan Pro'
              : `Plan gratuit: ${usage.created_count}/${usage.free_limit} devis crees`}
          </p>
        </div>
        <div className="topbar-actions">
          {!isPaid && (
            <button onClick={handleCheckout} className="secondary">
              Passer Pro
            </button>
          )}
          {isPaid && (
            <button onClick={handlePortal} className="secondary">
              Gerer abonnement
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
        <section className="content wide">
          <div className="section-heading">
            <div>
              <h2>Mes devis</h2>
              <p>Retrouvez et exportez vos devis clients.</p>
            </div>
            <button onClick={() => setView('create')} className="primary">
              Creer un devis
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Devis</span>
              <strong>{invoices.length}</strong>
            </div>
            <div className="stat-card">
              <span>Acceptes HT</span>
              <strong>{formatPrice(acceptedTotal)}</strong>
            </div>
            <div className="stat-card">
              <span>En attente HT</span>
              <strong>{formatPrice(pendingTotal)}</strong>
            </div>
          </div>

          <div className="filters">
            <input
              placeholder="Rechercher client, numero, description"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoye</option>
              <option value="accepted">Accepte</option>
              <option value="refused">Refuse</option>
            </select>
            <select
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            >
              <option value="all">Tous les documents</option>
              <option value="quote">Devis</option>
              <option value="invoice">Factures</option>
            </select>
          </div>

          {loading ? (
            <p>Chargement des devis...</p>
          ) : (
            <InvoiceList
              invoices={filteredInvoices}
              onChanged={handleInvoiceChanged}
              onDeleted={handleInvoiceDeleted}
            />
          )}
        </section>
      ) : view === 'clients' ? (
        <ClientsPage
          clients={clients}
          onCreated={handleClientCreated}
          onChanged={handleClientChanged}
          onDeleted={handleClientDeleted}
        />
      ) : (
        <CreateInvoicePage clients={clients} onCreated={handleCreated} onCancel={() => setView('dashboard')} />
      )}
    </main>
  );
}
