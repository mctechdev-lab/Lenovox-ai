// ================================================================
// api/meetup-rooms.js — MeetUp Study Rooms API
// Actions: cleanup expired rooms, reward LNX for study sessions
// ================================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  if (sa.project_id) initializeApp({ credential: cert(sa) });
}

const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000;
const LNX_SESSION_REWARD = 5;
const LNX_SESSION_MIN_MSGS = 10;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, uid, roomId, messageCount } = req.method === 'GET' ? req.query : (req.body || {});
  let db;
  try { db = getFirestore(); } catch { return res.status(500).json({ error: 'DB unavailable' }); }

  if (!action || action === 'cleanup') {
    const cutoff = new Date(Date.now() - ROOM_EXPIRY_MS);
    const snap = await db.collection('studyRooms').where('lastActivity', '<', cutoff).get().catch(() => null);
    let deleted = 0;
    if (snap) for (const d of snap.docs) { if (!(d.data().memberCount > 0)) { await d.ref.delete(); deleted++; } }
    return res.status(200).json({ success: true, deleted });
  }

  if (action === 'session_reward' && uid && parseInt(messageCount || 0) >= LNX_SESSION_MIN_MSGS) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `room_${uid}_${today}_${roomId}`;
    const ref = db.doc(`rewardTracking/${key}`);
    if ((await ref.get()).exists) return res.status(200).json({ success: false, message: 'Already rewarded' });
    await ref.set({ uid, roomId, date: today, timestamp: FieldValue.serverTimestamp() });
    await db.doc(`wallets/${uid}`).update({ balance: FieldValue.increment(LNX_SESSION_REWARD), totalEarned: FieldValue.increment(LNX_SESSION_REWARD) });
    await db.doc(`users/${uid}`).update({ lnxBalance: FieldValue.increment(LNX_SESSION_REWARD) });
    await db.collection(`wallets/${uid}/transactions`).add({ type: 'Study Room Session', amount: LNX_SESSION_REWARD, roomId, timestamp: FieldValue.serverTimestamp(), date: new Date().toLocaleString() });
    return res.status(200).json({ success: true, lnxReward: LNX_SESSION_REWARD });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
