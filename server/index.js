import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import invoiceRoutes from './routes/invoices.js';
import clientRoutes from './routes/clients.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use('/webhook', webhookRoutes);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ name: 'DevisPro API', status: 'running' });
});

app.use('/', invoiceRoutes);
app.use('/', clientRoutes);
app.use('/', paymentRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`DevisPro API running on port ${port}`);
});
