// ================================================================
// api/ads.js — Lenovox Ad Reward System
// Handles: reward verification, cooldown, daily limits, fraud checks
// Works with: Google AdSense (web) + Google AdMob (app)
// ================================================================

// In-memory stores — reset on cold start. For production use Redis/Firestore.
const cooldowns  = new Map(); // uid → last rewarded ad timestamp
const dailyCounts= new Map(); // `uid_YYYY-MM-DD` → count

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { uid, adType, platform } = req.body;
  if (!uid || !adType) return res.status(400).json({ error: 'uid and adType are required.' });

  // ── Reward amounts per ad type ────────────────────────────────
  const REWARDS = {
    rewarded_video:  15,  // Full rewarded video (most valuable)
    interstitial:     8,  // Full-screen between actions
    banner:           2,  // Passive banner impression
    referral_unlock: 10,  // Watching ad to unlock a referral reward
  };
  const lnxReward = REWARDS[adType] || 5;

  // ── Anti-fraud: 3-minute cooldown between rewarded ads ───────
  const COOLDOWN_MS = 3 * 60 * 1000;
  if (adType === 'rewarded_video' || adType === 'referral_unlock') {
    const last = cooldowns.get(uid) || 0;
    const wait = COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) {
      return res.status(429).json({
        error: `Please wait ${Math.ceil(wait / 1000)} seconds before watching another ad.`,
        waitSeconds: Math.ceil(wait / 1000),
      });
    }
    cooldowns.set(uid, Date.now());
  }

  // ── Daily limit: max 20 rewarded ads per user per day ────────
  const dayKey = `${uid}_${new Date().toISOString().slice(0, 10)}`;
  const count  = dailyCounts.get(dayKey) || 0;
  if (adType === 'rewarded_video' && count >= 20) {
    return res.status(429).json({
      error: 'You have reached your daily ad limit (20 ads/day). Come back tomorrow!',
      limitReached: true,
      dailyCount: count,
      dailyLimit: 20,
    });
  }
  dailyCounts.set(dayKey, count + 1);

  return res.status(200).json({
    success:    true,
    lnxReward,
    adType,
    platform:   platform || 'web',
    dailyCount: count + 1,
    dailyLimit: 20,
    message:    `+${lnxReward} LNX earned from watching an ad!`,
  });
}
