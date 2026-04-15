// ================================================================
// api/ads.js — Lenovox Ad Reward System
// Ad Networks: Monetag (rewarded) + HilltopAds (banner)
// Rules:
//   - User earns 8 LNX per completed ad
//   - Max 15 ads per day
//   - 3-minute cooldown between rewarded ads
//   - Must watch 2 ads before daily claim unlocks
//   - Referral rewards unlock after 2 ads watched
// Uses Firebase Admin to persist limits — survives Vercel cold starts
// ================================================================

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ── Init Firebase Admin once ──
if (!getApps().length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  if (sa.project_id) {
    initializeApp({ credential: cert(sa) });
  }
}

const REWARDS = {
  rewarded_video:  8,
  interstitial:    8,
  referral_unlock: 4,
  banner:          1,
};

const DAILY_LIMIT   = 15;          // max ads per day
const COOLDOWN_MS   = 3 * 60 * 1000; // 3 minutes between rewarded ads
const REFERRAL_REQ  = 2;            // ads needed to unlock referral
const CLAIM_REQ     = 2;            // ads needed to unlock daily claim

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'POST only.' });

  const { uid, adType = 'rewarded_video', adCompleted, adShown } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required.' });

  // Ad must load and must not be dismissed early
  if (adShown === false) {
    return res.status(200).json({ success: false, error: 'Ad did not load.', noAd: true });
  }
  if (adCompleted === false && adType === 'rewarded_video') {
    return res.status(200).json({ success: false, error: 'Watch the full ad to earn LNX.', dismissed: true });
  }

  const lnxReward = REWARDS[adType] || 8;
  const today     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // ── Use Firestore to persist ad tracking ──
    let db;
    try {
      db = getFirestore();
    } catch {
      // Firebase Admin not initialised (missing FIREBASE_SERVICE_ACCOUNT)
      // Fall back to no-persistence mode — still credit the reward
      return res.status(200).json({
        success: true, lnxReward, adType,
        dailyCount: 1, dailyLimit: DAILY_LIMIT,
        message: `+${lnxReward} LNX earned!`,
      });
    }

    const adRef  = db.doc(`adTracking/${uid}`);
    const adSnap = await adRef.get();
    const adData = adSnap.exists ? adSnap.data() : {};

    const todayCount   = adData.date === today ? (adData.count || 0) : 0;
    const lastAdAt     = adData.lastAdAt || 0;
    const totalWatched = adData.totalWatched || 0;

    // ── Daily limit check ──
    if (todayCount >= DAILY_LIMIT) {
      return res.status(429).json({
        success: false,
        error: `Daily limit reached (${DAILY_LIMIT} ads/day). Come back tomorrow!`,
        limitReached: true,
        dailyCount: todayCount,
        dailyLimit: DAILY_LIMIT,
      });
    }

    // ── Cooldown check (rewarded ads only) ──
    if (adType === 'rewarded_video' || adType === 'interstitial') {
      const waited = Date.now() - lastAdAt;
      if (waited < COOLDOWN_MS) {
        const waitSecs = Math.ceil((COOLDOWN_MS - waited) / 1000);
        return res.status(429).json({
          success: false,
          error: `Wait ${waitSecs}s before next ad.`,
          waitSeconds: waitSecs,
        });
      }
    }

    // ── All checks passed — update Firestore tracking ──
    const newCount   = todayCount + 1;
    const newTotal   = totalWatched + 1;

    await adRef.set({
      uid,
      date:         today,
      count:        newCount,
      lastAdAt:     Date.now(),
      totalWatched: newTotal,
      updatedAt:    FieldValue.serverTimestamp(),
    });

    // ── Check unlock states ──
    const referralUnlocked = newTotal >= REFERRAL_REQ && totalWatched < REFERRAL_REQ;
    const claimUnlocked    = newTotal >= CLAIM_REQ;

    return res.status(200).json({
      success: true,
      lnxReward,
      adType,
      platform:        'monetag',
      dailyCount:      newCount,
      dailyLimit:      DAILY_LIMIT,
      totalWatched:    newTotal,
      referralUnlocked,
      claimUnlocked,
      adsForClaim:     Math.max(0, CLAIM_REQ - newTotal),
      message:         `+${lnxReward} LNX earned! (${newCount}/${DAILY_LIMIT} today)`,
    });

  } catch (err) {
    console.error('ads.js error:', err);
    // Still credit the user even if tracking fails
    return res.status(200).json({
      success: true, lnxReward, adType,
      message: `+${lnxReward} LNX earned!`,
    });
  }
}
