import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import invoiceRoutes from './routes/invoices.js';
import clientRoutes from './routes/clients.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();
const port = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
}

app.use('/webhook', webhookRoutes);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', invoiceRoutes);
app.use('/api', clientRoutes);
app.use('/api', paymentRoutes);

app.use('/', invoiceRoutes);
app.use('/', clientRoutes);
app.use('/', paymentRoutes);

if (isProduction) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`DevisPro API running on port ${port}`);
});
