import { useState } from 'react';
import { createInvoice } from '../api.js';

const serviceTemplates = [
  { label: 'Deplacement sur site', quantity: 1, unit_price: 45, vat_rate: 20 },
  { label: 'Diagnostic / recherche de panne', quantity: 1, unit_price: 80, vat_rate: 20 },
  { label: 'Main-d oeuvre standard', quantity: 1, unit_price: 55, vat_rate: 20 },
  { label: 'Main-d oeuvre urgence soir / week-end', quantity: 1, unit_price: 95, vat_rate: 20 },
  { label: 'Depannage plomberie', quantity: 1, unit_price: 120, vat_rate: 10 },
  { label: 'Remplacement robinetterie', quantity: 1, unit_price: 180, vat_rate: 10 },
  { label: 'Reparation fuite', quantity: 1, unit_price: 160, vat_rate: 10 },
  { label: 'Debouchage canalisation', quantity: 1, unit_price: 140, vat_rate: 10 },
  { label: 'Installation chauffe-eau', quantity: 1, unit_price: 650, vat_rate: 10 },
  { label: 'Depannage electricite', quantity: 1, unit_price: 130, vat_rate: 10 },
  { label: 'Remplacement prise ou interrupteur', quantity: 1, unit_price: 75, vat_rate: 10 },
  { label: 'Pose luminaire', quantity: 1, unit_price: 90, vat_rate: 10 },
  { label: 'Mise aux normes tableau electrique', quantity: 1, unit_price: 850, vat_rate: 10 },
  { label: 'Pose materiel fourni par client', quantity: 1, unit_price: 120, vat_rate: 20 },
  { label: 'Fourniture et pose materiel', quantity: 1, unit_price: 250, vat_rate: 20 },
  { label: 'Peinture murale au m2', quantity: 10, unit_price: 28, vat_rate: 10 },
  { label: 'Preparation support / enduit au m2', quantity: 10, unit_price: 18, vat_rate: 10 },
  { label: 'Pose parquet au m2', quantity: 10, unit_price: 45, vat_rate: 10 },
  { label: 'Pose carrelage au m2', quantity: 10, unit_price: 55, vat_rate: 10 },
  { label: 'Montage meuble / agencement', quantity: 1, unit_price: 180, vat_rate: 20 },
  { label: 'Nettoyage fin de chantier', quantity: 1, unit_price: 150, vat_rate: 20 },
  { label: 'Evacuation gravats', quantity: 1, unit_price: 120, vat_rate: 20 },
  { label: 'Forfait demi-journee', quantity: 1, unit_price: 220, vat_rate: 20 },
  { label: 'Forfait journee', quantity: 1, unit_price: 420, vat_rate: 20 }
];

const customTemplatesKey = 'devispro_custom_service_templates';

function emptyLine() {
  return { label: '', quantity: 1, unit_price: '', vat_rate: 20 };
}

function loadCustomTemplates() {
  try {
    const stored = localStorage.getItem(customTemplatesKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveCustomTemplates(templates) {
  localStorage.setItem(customTemplatesKey, JSON.stringify(templates));
}

export default function CreateInvoicePage({ clients, businessProfile, onCreated, onCancel }) {
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState('');
  const [lineItems, setLineItems] = useState([emptyLine()]);
  const [customTemplates, setCustomTemplates] = useState(loadCustomTemplates);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const allTemplates = [...serviceTemplates, ...customTemplates];

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
    const template = allTemplates[Number(templateIndex)];
    setLineItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...template } : item))
    );
  }

  function saveLineAsTemplate(index) {
    const item = lineItems[index];

    if (!item.label || !item.unit_price) {
      setMessage('Renseignez au moins le nom et le prix HT avant de sauvegarder le modele.');
      return;
    }

    const nextTemplates = [
      ...customTemplates,
      {
        label: item.label.trim(),
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        vat_rate: Number(item.vat_rate) || 0
      }
    ].sort((a, b) => a.label.localeCompare(b.label));

    setCustomTemplates(nextTemplates);
    saveCustomTemplates(nextTemplates);
    setMessage('Modele personnalise enregistre.');
  }

  function deleteCustomTemplate(label) {
    const nextTemplates = customTemplates.filter((template) => template.label !== label);
    setCustomTemplates(nextTemplates);
    saveCustomTemplates(nextTemplates);
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
                  {allTemplates.map((template, templateIndex) => (
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
                Qte
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
              <button type="button" className="secondary compact" onClick={() => saveLineAsTemplate(index)}>
                Sauver modele
              </button>
            </div>
          ))}

          {customTemplates.length > 0 && (
            <div className="custom-templates">
              <h3>Modeles personnalises</h3>
              {customTemplates.map((template) => (
                <div key={template.label} className="custom-template-row">
                  <span>{template.label}</span>
                  <button type="button" className="danger compact" onClick={() => deleteCustomTemplate(template.label)}>
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}

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
