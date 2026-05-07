import { useState } from 'react';
import { createInvoice } from '../api.js';

export default function CreateInvoicePage({ clients, onCreated, onCancel }) {
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function handleClientChange(value) {
    setClientId(value);
    const selectedClient = clients.find((item) => item.id === value);
    setClient(selectedClient?.name || '');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const invoice = await createInvoice({
        client,
        client_id: clientId || null,
        description,
        price: Number(price),
        vat_rate: Number(vatRate)
      });
      onCreated(invoice);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content narrow">
      <div className="section-heading">
        <div>
          <h2>Nouveau devis</h2>
          <p>Ajoutez les informations principales du devis.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invoice-form">
        <label>
          Client enregistre
          <select value={clientId} onChange={(event) => handleClientChange(event.target.value)}>
            <option value="">Saisie libre</option>
            {clients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Nom du client
          <input value={client} onChange={(event) => setClient(event.target.value)} required />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
        </label>

        <label>
          Prix HT
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </label>

        <label>
          TVA (%)
          <input
            type="number"
            min="0"
            step="0.1"
            value={vatRate}
            onChange={(event) => setVatRate(event.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="ghost">
            Annuler
          </button>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
