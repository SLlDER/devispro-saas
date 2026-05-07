import { requireStripe } from '../stripe.js';

export async function createCheckoutSession(req, res) {
  const stripe = requireStripe();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    customer_email: req.user.email,
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
