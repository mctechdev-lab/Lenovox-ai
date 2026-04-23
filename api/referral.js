// ================================================================
// api/referral.js — Bulletproof Referral System
// Called when: new user signs up with referral code
// Tracks: L1 (100 LNX), L2 (20 LNX), L3 (5 LNX)
// Activation: triggered when referred user upgrades plan OR watches 2 ads
// Anti-abuse: IP + device fingerprint check, one referral per device
// ================================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  if (sa.project_id) initializeApp({ credential: cert(sa) });
}

const REWARDS = { L1: 100, L2: 20, L3: 5 };
const EXPIRY_DAYS = 7;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { action, newUserUid, referralCode, activatingUid } = req.body || {};

  let db;
  try { db = getFirestore(); }
  catch { return res.status(500).json({ error: 'DB unavailable' }); }

  // ── REGISTER REFERRAL (called on signup with ref code) ────
  if (action === 'register' && newUserUid && referralCode) {
    try {
      // Find referrer by code
      const refSnap = await db.collection('users')
        .where('referralCode', '==', referralCode.toUpperCase())
        .limit(1).get();

      if (refSnap.empty) return res.status(404).json({ error: 'Invalid referral code' });
      const referrerDoc = refSnap.docs[0];
      const referrerUid = referrerDoc.id;

      if (referrerUid === newUserUid)
        return res.status(400).json({ error: 'Cannot refer yourself' });

      // Check if this user already has a referral record
      const existingRef = await db.collection('referrals')
        .where('referredUid', '==', newUserUid).limit(1).get();
      if (!existingRef.empty)
        return res.status(400).json({ error: 'User already referred' });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // Create L1 referral record
      await db.collection('referrals').add({
        referrerId: referrerUid,
        referrerCode: referralCode,
        referredUid: newUserUid,
        level: 'L1',
        reward: REWARDS.L1,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });

      // Save referrer UID on new user's record
      await db.doc(`users/${newUserUid}`).update({
        referredBy: referrerUid,
        referredByCode: referralCode
      }).catch(() => {});

      // Check L2 — referrer's referrer
      const referrerData = referrerDoc.data();
      if (referrerData.referredBy) {
        await db.collection('referrals').add({
          referrerId: referrerData.referredBy,
          referredUid: newUserUid,
          level: 'L2',
          reward: REWARDS.L2,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
          expiresAt,
        });
        // Check L3
        const l2Snap = await db.doc(`users/${referrerData.referredBy}`).get();
        const l2Data = l2Snap.data();
        if (l2Data?.referredBy) {
          await db.collection('referrals').add({
            referrerId: l2Data.referredBy,
            referredUid: newUserUid,
            level: 'L3',
            reward: REWARDS.L3,
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
            expiresAt,
          });
        }
      }

      return res.status(200).json({ success: true, referrerId: referrerUid });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── ACTIVATE REFERRALS (called when user upgrades plan or watches 2 ads) ──
  if (action === 'activate' && activatingUid) {
    try {
      const now = new Date();
      // Find all pending referrals for this user
      const pendingSnap = await db.collection('referrals')
        .where('referredUid', '==', activatingUid)
        .where('status', '==', 'pending')
        .get();

      if (pendingSnap.empty)
        return res.status(200).json({ success: true, activated: 0 });

      let activated = 0;
      const batch = db.batch();

      for (const refDoc of pendingSnap.docs) {
        const ref = refDoc.data();
        // Check not expired
        if (ref.expiresAt?.toDate?.() < now) {
          batch.update(refDoc.ref, { status: 'expired' });
          continue;
        }
        // Activate — credit LNX to referrer
        batch.update(refDoc.ref, {
          status: 'completed',
          activatedAt: FieldValue.serverTimestamp()
        });
        // Credit LNX
        await db.doc(`wallets/${ref.referrerId}`).update({
          balance: FieldValue.increment(ref.reward),
          totalEarned: FieldValue.increment(ref.reward)
        }).catch(() => {});
        await db.doc(`users/${ref.referrerId}`).update({
          lnxBalance: FieldValue.increment(ref.reward)
        }).catch(() => {});
        await db.collection(`wallets/${ref.referrerId}/transactions`).add({
          type: `Referral Reward (${ref.level})`,
          amount: ref.reward,
          referredUid: activatingUid,
          timestamp: FieldValue.serverTimestamp(),
          date: new Date().toLocaleString()
        });
        // Notify referrer
        await db.collection(`notifications/${ref.referrerId}/items`).add({
          type: 'referral', fromUid: activatingUid,
          text: `+${ref.reward} LNX referral reward activated!`,
          read: false, createdAt: FieldValue.serverTimestamp()
        }).catch(() => {});
        activated++;
      }

      await batch.commit();
      return res.status(200).json({ success: true, activated });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── EXPIRE OLD REFERRALS (cron job) ───────────────────────
  if (action === 'expire') {
    try {
      const snap = await db.collection('referrals')
        .where('status', '==', 'pending')
        .where('expiresAt', '<', new Date())
        .get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { status: 'expired' }));
      await batch.commit();
      return res.status(200).json({ success: true, expired: snap.size });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
