# DevisPro

## Installation

```bash
npm install
```

## Environment

Copy the environment files and fill the values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## Database

Run `database.sql` in the Supabase SQL editor.

## Development

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3001`

## Railway single-app deployment

Railway can deploy the whole SaaS from the repository root.

Build command:

```bash
npm run build
```

Start command:

```bash
npm start
```

Required Railway variables:

```env
NODE_ENV=production
CLIENT_URL=https://your-railway-domain
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_ID=your_stripe_subscription_price_id
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=/api
```
