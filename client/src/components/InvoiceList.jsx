import { jsPDF } from 'jspdf';

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
  return Number(Number(price).toFixed(2));
}

function downloadInvoice(invoice) {
  const pdf = new jsPDF();
  const client = invoice.clients;
  const subtotal = moneyValue(invoice.price);
  const vatRate = Number(invoice.vat_rate ?? 20);
  const vat = moneyValue((subtotal * vatRate) / 100);
  const total = moneyValue(subtotal + vat);
  const invoiceNumber = `DEV-${new Date(invoice.created_at).getFullYear()}-${invoice.id.slice(0, 8).toUpperCase()}`;

  pdf.setFillColor(15, 118, 110);
  pdf.rect(0, 0, 210, 34, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DEVIS', 20, 22);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoiceNumber, 150, 14);
  pdf.text(`Date: ${formatDate(invoice.created_at)}`, 150, 22);

  pdf.setTextColor(24, 33, 47);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DevisPro', 20, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Gestion de devis pour artisans', 20, 58);
  pdf.text('Email: contact@devispro.fr', 20, 66);

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
  pdf.text('Description', 24, 120);
  pdf.text('Montant HT', 160, 120, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(pdf.splitTextToSize(invoice.description, 118), 24, 136);
  pdf.text(formatPrice(subtotal), 160, 136, { align: 'right' });

  pdf.line(20, 164, 190, 164);
  pdf.setFontSize(11);
  pdf.text('Total HT', 130, 176);
  pdf.text(formatPrice(subtotal), 190, 176, { align: 'right' });
  pdf.text(`TVA (${vatRate}%)`, 130, 188);
  pdf.text(formatPrice(vat), 190, 188, { align: 'right' });

  pdf.setFillColor(15, 118, 110);
  pdf.rect(126, 197, 64, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total TTC', 130, 206);
  pdf.text(formatPrice(total), 188, 206, { align: 'right' });

  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Devis valable 30 jours. Bon pour accord avec signature et date.', 20, 260);
  pdf.text('Merci pour votre confiance.', 20, 268);

  pdf.save(`${invoiceNumber.toLowerCase()}-${invoice.client.toLowerCase().replaceAll(' ', '-')}.pdf`);
}

export default function InvoiceList({ invoices }) {
  if (invoices.length === 0) {
    return <p className="empty">Aucun devis pour le moment.</p>;
  }

  return (
    <div className="invoice-list">
      {invoices.map((invoice) => (
        <article key={invoice.id} className="invoice-card">
          <div>
            <h3>{invoice.client}</h3>
            <p>{invoice.description}</p>
            <span>{formatDate(invoice.created_at)} · TVA {Number(invoice.vat_rate ?? 20)}%</span>
          </div>
          <div className="invoice-card-side">
            <strong>{formatPrice(invoice.price)}</strong>
            <button onClick={() => downloadInvoice(invoice)} className="secondary">
              PDF
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
