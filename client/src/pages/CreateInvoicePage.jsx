import { useState } from 'react';
import { createInvoice } from '../api.js';

const serviceTemplates = [
  { label: 'Depannage plomberie', quantity: 1, unit_price: 120, vat_rate: 10 },
  { label: 'Pose materiel', quantity: 1, unit_price: 250, vat_rate: 20 },
  { label: 'Main-d oeuvre', quantity: 1, unit_price: 55, vat_rate: 20 }
];

function emptyLine() {
  return { label: '', quantity: 1, unit_price: '', vat_rate: 20 };
}

export default function CreateInvoicePage({ clients, businessProfile, onCreated, onCancel }) {
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState('');
  const [lineItems, setLineItems] = useState([emptyLine()]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function handleClientChange(value) {
    setClientId(value);
    const selectedClient = clients.find((item) => item.id === value);
    setClient(selectedClient?.name || '');
  }

  function updateLine(index, field, value) {
    setLineItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  }

  function addLine(template = emptyLine()) {
    setLineItems((current) => [...current, template]);
  }

  function removeLine(index) {
    setLineItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  function applyTemplate(index, templateIndex) {
    if (templateIndex === '') return;
    const template = serviceTemplates[Number(templateIndex)];
    setLineItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...template } : item))
    );
  }

  const subtotal = lineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!businessProfile) {
      setMessage('Completez vos informations entreprise avant de creer un devis.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const description = lineItems.map((item) => item.label).filter(Boolean).join(', ');
      const invoice = await createInvoice({
        client,
        client_id: clientId || null,
        description,
        price: subtotal,
        vat_rate: Number(lineItems[0]?.vat_rate ?? 20),
        line_items: lineItems.map((item) => ({
          label: item.label,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          vat_rate: Number(item.vat_rate)
        }))
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

        <div className="line-items">
          <div className="line-items-header">
            <h3>Prestations</h3>
            <button type="button" className="secondary" onClick={() => addLine()}>
              Ajouter une ligne
            </button>
          </div>

          {lineItems.map((item, index) => (
            <div className="line-item" key={index}>
              <label>
                Modele
                <select onChange={(event) => applyTemplate(index, event.target.value)} defaultValue="">
                  <option value="">Choisir</option>
                  {serviceTemplates.map((template, templateIndex) => (
                    <option key={template.label} value={templateIndex}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="line-description">
                Prestation
                <input
                  value={item.label}
                  onChange={(event) => updateLine(index, 'label', event.target.value)}
                  required
                />
              </label>
              <label>
                Qté
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                  required
                />
              </label>
              <label>
                Prix HT
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(event) => updateLine(index, 'unit_price', event.target.value)}
                  required
                />
              </label>
              <label>
                TVA
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.vat_rate}
                  onChange={(event) => updateLine(index, 'vat_rate', event.target.value)}
                  required
                />
              </label>
              <button type="button" className="ghost compact" onClick={() => removeLine(index)}>
                Retirer
              </button>
            </div>
          ))}

          <p className="form-total">Total HT: {subtotal.toFixed(2)} EUR</p>
        </div>

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
