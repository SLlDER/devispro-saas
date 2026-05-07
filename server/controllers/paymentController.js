import { requireStripe } from '../stripe.js';

async function getOrCreateCustomer(stripe, user) {
  if (user.app_metadata?.stripe_customer_id) {
    return user.app_metadata.stripe_customer_id;
  }

  const existingCustomers = await stripe.customers.list({
    email: user.email,
    limit: 1
  });

  if (existingCustomers.data[0]) {
    return existingCustomers.data[0].id;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      user_id: user.id
    }
  });

  return customer.id;
}

export async function createCheckoutSession(req, res) {
  const stripe = requireStripe();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });
  }

  const customerId = await getOrCreateCustomer(stripe, req.user);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    client_reference_id: req.user.id,
    success_url: `${clientUrl}?checkout=success`,
    cancel_url: `${clientUrl}?checkout=cancelled`,
    metadata: {
      user_id: req.user.id
    },
    subscription_data: {
      metadata: {
        user_id: req.user.id
      }
    }
  });

  res.json({ url: session.url });
}

export async function createPortalSession(req, res) {
  const stripe = requireStripe();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const customerId = await getOrCreateCustomer(stripe, req.user);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: clientUrl
  });

  res.json({ url: session.url });
}
