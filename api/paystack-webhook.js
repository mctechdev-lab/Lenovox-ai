// ================================================================
// api/paystack-webhook.js — Lenovox Paystack Webhook Handler
// Verifies payment → upgrades user plan → credits monthly LNX bonus
// Register this URL in Paystack dashboard → Settings → Webhooks:
//   https://your-vercel-url.vercel.app/api/paystack-webhook
// ================================================================
import crypto from 'crypto';

// Firebase Admin SDK for server-side Firestore writes
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialise Firebase Admin (only once)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({ credential: cert(serviceAccount) });
}
const adminDb = getFirestore();

// Plan config: monthly LNX bonuses and daily reward amounts
const PLAN_CONFIG = {
  starter:  { lnxBonus: 3000,  dailyLNX: 500,  label: 'Starter Plan'  },
  standard: { lnxBonus: 7000,  dailyLNX: 700,  label: 'Standard Plan' },
  pro:      { lnxBonus: 12000, dailyLNX: 1000, label: 'Pro Plan'       },
  elite:    { lnxBonus: 25000, dailyLNX: 2000, label: 'Elite Plan'     },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // ── 1. Verify Paystack signature ──────────────────────────────
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Invalid Paystack signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  // ── 2. Only handle successful charges ────────────────────────
  if (event.event !== 'charge.success') {
    return res.status(200).json({ received: true });
  }

  const { reference, metadata, customer } = event.data;
  const uid  = metadata?.uid;
  const plan = metadata?.plan?.toLowerCase();

  if (!uid || !plan || !PLAN_CONFIG[plan]) {
    console.error('Missing uid or plan in metadata:', metadata);
    return res.status(200).json({ received: true });
  }

  const config = PLAN_CONFIG[plan];
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  try {
    const userRef  = adminDb.doc(`users/${uid}`);
    const walletRef = adminDb.doc(`wallets/${uid}`);
    const subRef   = adminDb.doc(`subscriptions/${uid}`);
    const txRef    = adminDb.collection(`wallets/${uid}/transactions`);

    // ── 3. Update user plan ───────────────────────────────────
    await userRef.update({
      plan,
      planExpiry:  endDate,
      dailyLNX:    config.dailyLNX,
      lnxBalance:  FieldValue.increment(config.lnxBonus),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // ── 4. Update wallet ──────────────────────────────────────
    await walletRef.update({
      balance:     FieldValue.increment(config.lnxBonus),
      totalEarned: FieldValue.increment(config.lnxBonus),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // ── 5. Log transaction ────────────────────────────────────
    await txRef.add({
      type:      `${config.label} · Monthly Bonus`,
      amount:    config.lnxBonus,
      timestamp: FieldValue.serverTimestamp(),
      date:      now.toLocaleString(),
    });

    // ── 6. Create/update subscription record ──────────────────
    await subRef.set({
      plan,
      status:             'active',
      paystackRef:        reference,
      startDate:          now,
      endDate,
      monthlyBonusClaimed: true,
      updatedAt:          FieldValue.serverTimestamp(),
    });

    console.log(`✅ Plan upgraded: uid=${uid} plan=${plan} bonus=${config.lnxBonus} LNX`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Internal error processing payment' });
  }
}
