import { jsPDF } from 'jspdf';
import { deleteInvoice, updateInvoice } from '../api.js';

const statusLabels = {
  draft: 'Brouillon',
  sent: 'Envoye',
  accepted: 'Accepte',
  refused: 'Refuse'
};

const typeLabels = {
  quote: 'Devis',
  invoice: 'Facture'
};

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(price));
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
}

function moneyValue(price) {
  return Number(Number(price || 0).toFixed(2));
}

function getLineItems(invoice) {
  if (Array.isArray(invoice.line_items) && invoice.line_items.length > 0) {
    return invoice.line_items;
  }

  return [
    {
      label: invoice.description,
      quantity: 1,
      unit_price: Number(invoice.price),
      vat_rate: Number(invoice.vat_rate ?? 20)
    }
  ];
}

function getTotals(invoice) {
  const lineItems = getLineItems(invoice);
  const subtotal = moneyValue(
    lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0)
  );
  const vat = moneyValue(
    lineItems.reduce(
      (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) * Number(item.vat_rate || 0)) / 100,
      0
    )
  );

  return {
    subtotal,
    vat,
    total: moneyValue(subtotal + vat)
  };
}

function buildInvoicePdf(invoice, businessProfile) {
  const pdf = new jsPDF();
  const client = invoice.clients;
  const lineItems = getLineItems(invoice);
  const totals = getTotals(invoice);
  const documentNumber = invoice.document_number || `${invoice.id.slice(0, 8).toUpperCase()}`;
  const documentTitle = invoice.document_type === 'invoice' ? 'FACTURE' : 'DEVIS';
  const issuer = businessProfile || {};

  pdf.setFillColor(15, 118, 110);
  pdf.rect(0, 0, 210, 34, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(documentTitle, 20, 22);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(documentNumber, 150, 14);
  pdf.text(`Date: ${formatDate(invoice.created_at)}`, 150, 22);

  pdf.setTextColor(24, 33, 47);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(issuer.business_name || 'Entreprise', 20, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  const issuerLines = [
    issuer.legal_form ? `${issuer.legal_form}${issuer.owner_name ? ` - ${issuer.owner_name}` : ''}` : issuer.owner_name,
    issuer.address,
    issuer.siret ? `SIRET: ${issuer.siret}` : null,
    issuer.vat_number ? `TVA: ${issuer.vat_number}` : null,
    issuer.email ? `Email: ${issuer.email}` : null,
    issuer.phone ? `Tel: ${issuer.phone}` : null
  ].filter(Boolean);
  pdf.text(pdf.splitTextToSize(issuerLines.join('\n'), 85), 20, 58);

  pdf.setTextColor(24, 33, 47);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Client', 130, 50);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  pdf.text(invoice.client, 130, 58);
  if (client?.email) pdf.text(client.email, 130, 66);
  if (client?.phone) pdf.text(client.phone, 130, 74);
  if (client?.address) pdf.text(pdf.splitTextToSize(client.address, 58), 130, 82);

  pdf.setDrawColor(226, 232, 240);
  pdf.line(20, 105, 190, 105);

  pdf.setFillColor(241, 245, 249);
  pdf.rect(20, 112, 170, 12, 'F');
  pdf.setTextColor(24, 33, 47);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Prestation', 24, 120);
  pdf.text('Qte', 112, 120, { align: 'right' });
  pdf.text('PU HT', 140, 120, { align: 'right' });
  pdf.text('Total HT', 186, 120, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  let y = 136;

  lineItems.forEach((item) => {
    const lineTotal = Number(item.quantity) * Number(item.unit_price);
    pdf.text(pdf.splitTextToSize(item.label, 78), 24, y);
    pdf.text(String(item.quantity), 112, y, { align: 'right' });
    pdf.text(formatPrice(item.unit_price), 140, y, { align: 'right' });
    pdf.text(formatPrice(lineTotal), 186, y, { align: 'right' });
    y += 12;
  });

  const totalsY = Math.max(y + 10, 176);
  pdf.line(20, totalsY - 10, 190, totalsY - 10);
  pdf.setFontSize(11);
  pdf.text('Total HT', 130, totalsY);
  pdf.text(formatPrice(totals.subtotal), 190, totalsY, { align: 'right' });
  pdf.text('TVA', 130, totalsY + 12);
  pdf.text(formatPrice(totals.vat), 190, totalsY + 12, { align: 'right' });

  pdf.setFillColor(15, 118, 110);
  pdf.rect(126, totalsY + 21, 64, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total TTC', 130, totalsY + 30);
  pdf.text(formatPrice(totals.total), 188, totalsY + 30, { align: 'right' });

  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const legalLines = [
    invoice.document_type === 'quote' ? 'Devis valable 30 jours. Bon pour accord avec signature et date.' : null,
    issuer.vat_exemption ? 'TVA non applicable, art. 293 B du CGI.' : null,
    issuer.default_payment_terms,
    issuer.default_late_fee,
    invoice.document_type === 'invoice' ? 'Indemnite forfaitaire pour frais de recouvrement: 40 EUR en cas de retard de paiement.' : null,
    issuer.insurance ? `Assurance professionnelle: ${issuer.insurance}` : null
  ].filter(Boolean);
  pdf.text(pdf.splitTextToSize(legalLines.join('\n'), 170), 20, 256);
  if (invoice.signed_by) {
    pdf.text(`Accepte par ${invoice.signed_by} le ${formatDate(invoice.accepted_at)}`, 20, 284);
  }

  const fileName = `${documentNumber.toLowerCase()}-${invoice.client.toLowerCase().replaceAll(' ', '-')}.pdf`;

  return { pdf, fileName, documentNumber };
}

function downloadInvoice(invoice, businessProfile) {
  const { pdf, fileName } = buildInvoicePdf(invoice, businessProfile);
  pdf.save(fileName);
}

function exportCsv(invoices) {
  const rows = [
    ['Numero', 'Type', 'Client', 'Statut', 'Date', 'Total HT'],
    ...invoices.map((invoice) => [
      invoice.document_number || invoice.id,
      typeLabels[invoice.document_type] || 'Devis',
      invoice.client,
      statusLabels[invoice.status] || invoice.status,
      formatDate(invoice.created_at),
      String(invoice.price)
    ])
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'devispro-export.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function emailInvoice(invoice, businessProfile) {
  const { pdf, fileName } = buildInvoicePdf(invoice, businessProfile);
  pdf.save(fileName);

  const subject = encodeURIComponent(`${typeLabels[invoice.document_type] || 'Devis'} ${invoice.document_number || ''}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nVeuillez trouver votre ${typeLabels[invoice.document_type]?.toLowerCase() || 'devis'} ${invoice.document_number || ''} d'un montant HT de ${formatPrice(invoice.price)}.\n\nLe PDF vient d'etre telecharge sur mon ordinateur. Je l'ajoute en piece jointe a cet email.\n\nCordialement,\n${businessProfile?.business_name || 'DevisPro'}`
  );
  const email = invoice.clients?.email || '';
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function InvoiceList({ invoices, businessProfile, onChanged, onDeleted }) {
  async function changeStatus(invoice, status) {
    const updated = await updateInvoice(invoice.id, { status });
    onChanged(updated);
  }

  async function signInvoice(invoice) {
    const signedBy = window.prompt('Nom du signataire');
    if (!signedBy) return;

    const updated = await updateInvoice(invoice.id, { signed_by: signedBy });
    onChanged(updated);
  }

  async function convertToInvoice(invoice) {
    const updated = await updateInvoice(invoice.id, { document_type: 'invoice' });
    onChanged(updated);
  }

  async function removeInvoice(invoice) {
    if (!window.confirm('Supprimer ce document ?')) return;
    await deleteInvoice(invoice.id);
    onDeleted(invoice.id);
  }

  if (invoices.length === 0) {
    return <p className="empty">Aucun document pour le moment.</p>;
  }

  return (
    <>
      <div className="list-toolbar">
        <button className="secondary" onClick={() => exportCsv(invoices)}>
          Export CSV
        </button>
      </div>
      <div className="invoice-list">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="invoice-card">
            <div>
              <div className="document-title">
                <h3>{invoice.document_number || invoice.client}</h3>
                <span className={`status-pill ${invoice.status}`}>{statusLabels[invoice.status] || invoice.status}</span>
              </div>
              <p>{invoice.client}</p>
              <span>
                {typeLabels[invoice.document_type] || 'Devis'} · {formatDate(invoice.created_at)}
              </span>
            </div>
            <div className="invoice-card-side">
              <strong>{formatPrice(invoice.price)} HT</strong>
              <div className="card-actions">
                <button onClick={() => downloadInvoice(invoice, businessProfile)} className="secondary compact">
                  PDF
                </button>
                <button onClick={() => emailInvoice(invoice, businessProfile)} className="ghost compact">
                  PDF + Email
                </button>
                <button onClick={() => changeStatus(invoice, 'sent')} className="ghost compact">
                  Envoye
                </button>
                <button onClick={() => signInvoice(invoice)} className="ghost compact">
                  Signer
                </button>
                {invoice.document_type !== 'invoice' && (
                  <button onClick={() => convertToInvoice(invoice)} className="ghost compact">
                    Facture
                  </button>
                )}
                <button onClick={() => changeStatus(invoice, 'refused')} className="ghost compact">
                  Refuse
                </button>
                <button onClick={() => removeInvoice(invoice)} className="danger compact">
                  Supprimer
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
