import { useState } from 'react';
import { createClient } from '../api.js';

export default function ClientsPage({ clients, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const client = await createClient(form);
      onCreated(client);
      setForm({ name: '', email: '', phone: '', address: '' });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <h2>Clients</h2>
          <p>Centralisez les coordonnees de vos clients.</p>
        </div>
      </div>

      <div className="split-layout">
        <form onSubmit={handleSubmit} className="invoice-form">
          <h3>Ajouter un client</h3>

          <label>
            Nom
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </label>

          <label>
            Telephone
            <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </label>

          <label>
            Adresse
            <textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          </label>

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Ajouter le client'}
          </button>

          {message && <p className="alert">{message}</p>}
        </form>

        <div className="client-list">
          {clients.length === 0 ? (
            <p className="empty">Aucun client pour le moment.</p>
          ) : (
            clients.map((client) => (
              <article key={client.id} className="client-card">
                <h3>{client.name}</h3>
                {client.email && <p>{client.email}</p>}
                {client.phone && <p>{client.phone}</p>}
                {client.address && <span>{client.address}</span>}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
