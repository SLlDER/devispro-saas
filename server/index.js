import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import invoiceRoutes from './routes/invoices.js';
import clientRoutes from './routes/clients.js';
import profileRoutes from './routes/profile.js';
import accountRoutes from './routes/account.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();
const port = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction || !hasClientBuild) {
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
}

app.use('/webhook', webhookRoutes);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', invoiceRoutes);
app.use('/api', clientRoutes);
app.use('/api', profileRoutes);
app.use('/api', accountRoutes);
app.use('/api', paymentRoutes);

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(clientIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.status(503).send('DevisPro frontend build is missing. Run npm run build before starting the server.');
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`DevisPro API running on port ${port}`);
});
