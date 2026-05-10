import { useState } from 'react';
import { deleteAccount, exportAccount, saveBusinessProfile, supabase } from '../api.js';

const emptyProfile = {
  business_name: '',
  owner_name: '',
  legal_form: '',
  siret: '',
  vat_number: '',
  address: '',
  email: '',
  phone: '',
  insurance: '',
  default_payment_terms: 'Paiement a reception de facture',
  default_late_fee: 'Penalites de retard exigibles sans rappel prealable',
  vat_exemption: false
};

export default function CompliancePage({ profile, onSaved }) {
  const [form, setForm] = useState({ ...emptyProfile, ...(profile || {}) });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const saved = await saveBusinessProfile(form);
      onSaved(saved);
      setMessage('Informations enregistrees.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    const data = await exportAccount();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'devispro-export-compte.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Supprimer definitivement votre compte et vos donnees ?')) return;
    await deleteAccount();
    await supabase.auth.signOut();
  }

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <h2>Entreprise & conformite</h2>
          <p>Ces informations apparaissent sur vos devis et factures.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invoice-form">
        <div className="form-grid">
          <label>
            Nom commercial ou raison sociale
            <input value={form.business_name} onChange={(event) => updateField('business_name', event.target.value)} required />
          </label>
          <label>
            Nom du dirigeant
            <input value={form.owner_name || ''} onChange={(event) => updateField('owner_name', event.target.value)} />
          </label>
          <label>
            Forme juridique
            <input placeholder="EI, SASU, SARL..." value={form.legal_form || ''} onChange={(event) => updateField('legal_form', event.target.value)} />
          </label>
          <label>
            SIRET
            <input value={form.siret} onChange={(event) => updateField('siret', event.target.value)} required />
          </label>
          <label>
            Numero TVA intracommunautaire
            <input value={form.vat_number || ''} onChange={(event) => updateField('vat_number', event.target.value)} />
          </label>
          <label>
            Email entreprise
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          </label>
          <label>
            Telephone
            <input value={form.phone || ''} onChange={(event) => updateField('phone', event.target.value)} />
          </label>
          <label>
            Assurance professionnelle
            <input value={form.insurance || ''} onChange={(event) => updateField('insurance', event.target.value)} />
          </label>
        </div>

        <label>
          Adresse
          <textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} required />
        </label>

        <label>
          Conditions de paiement
          <input value={form.default_payment_terms} onChange={(event) => updateField('default_payment_terms', event.target.value)} />
        </label>

        <label>
          Penalites de retard
          <input value={form.default_late_fee} onChange={(event) => updateField('default_late_fee', event.target.value)} />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.vat_exemption}
            onChange={(event) => updateField('vat_exemption', event.target.checked)}
          />
          Franchise en base de TVA: afficher "TVA non applicable, art. 293 B du CGI"
        </label>

        <button className="primary" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="legal-actions">
        <button className="secondary" onClick={handleExport}>
          Exporter mes donnees
        </button>
        <button className="danger" onClick={handleDeleteAccount}>
          Supprimer mon compte
        </button>
      </div>

      <p className="small-note">
        A verifier avec votre expert-comptable selon votre activite. DevisPro aide a produire des documents propres, mais ne remplace pas un conseil juridique.
      </p>
    </section>
  );
}
