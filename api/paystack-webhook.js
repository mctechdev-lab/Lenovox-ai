// ================================================================
// api/paystack-webhook.js — Lenovox Paystack Webhook Handler
// Handles: Plan upgrades + LNX topup purchases
// Register webhook URL in Paystack dashboard:
//   https://lenovox.com.ng/api/paystack-webhook
// Secret key stays in Vercel env: PAYSTACK_SECRET_KEY
// ================================================================
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const config = { api: { bodyParser: false } };

// Init Firebase Admin once
if (!getApps().length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  if (sa.project_id) initializeApp({ credential: cert(sa) });
}

// Plan config
const PLAN_CONFIG = {
  starter:  { lnxBonus: 3000,  dailyLNX: 500,  label: 'Starter Plan'  },
  standard: { lnxBonus: 7000,  dailyLNX: 700,  label: 'Standard Plan' },
  pro:      { lnxBonus: 12000, dailyLNX: 1000, label: 'Pro Plan'       },
  elite:    { lnxBonus: 25000, dailyLNX: 2000, label: 'Elite Plan'     },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Get raw body for signature verification
  const rawBody = await getRawBody(req);

  // Verify Paystack signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY not set in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Invalid Paystack signature — possible fraud attempt');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody);

  // Only handle successful charges
  if (event.event !== 'charge.success') {
    return res.status(200).json({ received: true });
  }

  const { reference, metadata } = event.data;
  const uid  = metadata?.uid;
  const type = metadata?.type; // 'lnx_topup' or plan name

  if (!uid) {
    console.error('No uid in metadata:', metadata);
    return res.status(200).json({ received: true });
  }

  let db;
  try { db = getFirestore(); }
  catch (e) { console.error('Firestore init failed:', e); return res.status(500).json({ error: 'DB error' }); }

  const now = new Date();

  try {
    // ── LNX TOPUP ──────────────────────────────────────────────
    if (type === 'lnx_topup') {
      const lnxAmount = parseInt(metadata?.lnxAmount || 0);
      if (!lnxAmount) return res.status(200).json({ received: true });

      await db.doc(`wallets/${uid}`).update({
        balance:     FieldValue.increment(lnxAmount),
        totalEarned: FieldValue.increment(lnxAmount),
        lastUpdated: FieldValue.serverTimestamp(),
      });
      await db.doc(`users/${uid}`).update({
        lnxBalance:  FieldValue.increment(lnxAmount),
        lastUpdated: FieldValue.serverTimestamp(),
      });
      await db.collection(`wallets/${uid}/transactions`).add({
        type:         `LNX Top Up · ${lnxAmount.toLocaleString()} LNX`,
        amount:       lnxAmount,
        paystackRef:  reference,
        timestamp:    FieldValue.serverTimestamp(),
        date:         now.toLocaleString(),
      });

      console.log(`✅ LNX Topup: uid=${uid} lnx=${lnxAmount} ref=${reference}`);
      return res.status(200).json({ success: true, type: 'topup', lnxAmount });
    }

    // ── PLAN UPGRADE ────────────────────────────────────────────
    const plan = metadata?.plan?.toLowerCase();
    if (!plan || !PLAN_CONFIG[plan]) {
      console.error('Unknown plan in metadata:', metadata);
      return res.status(200).json({ received: true });
    }

    const config = PLAN_CONFIG[plan];
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.doc(`users/${uid}`).update({
      plan,
      planExpiry:  endDate,
      dailyLNX:    config.dailyLNX,
      lnxBalance:  FieldValue.increment(config.lnxBonus),
      lastUpdated: FieldValue.serverTimestamp(),
    });
    await db.doc(`wallets/${uid}`).update({
      balance:     FieldValue.increment(config.lnxBonus),
      totalEarned: FieldValue.increment(config.lnxBonus),
      lastUpdated: FieldValue.serverTimestamp(),
    });
    await db.collection(`wallets/${uid}/transactions`).add({
      type:      `${config.label} · Plan Activated`,
      amount:    config.lnxBonus,
      paystackRef: reference,
      timestamp: FieldValue.serverTimestamp(),
      date:      now.toLocaleString(),
    });
    await db.doc(`subscriptions/${uid}`).set({
      plan, status: 'active',
      paystackRef: reference,
      startDate: now, endDate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Plan upgraded: uid=${uid} plan=${plan} bonus=${config.lnxBonus}`);
    return res.status(200).json({ success: true, type: 'plan', plan });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Processing error' });
  }
}
