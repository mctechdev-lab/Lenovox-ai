// api/ads.js — Lenovox Ad Reward System
// Rules: user gets 30% of ad revenue as LNX, ad MUST complete,
// educational ads only, 3-min cooldown, 15/day max, 2 ads for referral unlock
const cooldowns   = new Map();
const dailyCounts = new Map();
const referralAds = new Map();

const REWARDS = {
  rewarded_video:  8,  // reduced from 15 — user's 30% share
  interstitial:    4,
  banner:          1,
  referral_unlock: 4,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { uid, adType, platform, adCompleted, adShown } = req.body;
  if (!uid || !adType) return res.status(400).json({ error: 'uid and adType required.' });

  // No reward if ad did not load
  if (adShown === false) {
    return res.status(200).json({
      success: false,
      error: 'Ad did not load. No reward granted.',
      noAd: true,
    });
  }

  // No reward if user dismissed early (rewarded ads only)
  if (adCompleted === false && (adType === 'rewarded_video' || adType === 'referral_unlock')) {
    return res.status(200).json({
      success: false,
      error: 'Ad closed early. Watch the full ad to earn LNX.',
      dismissed: true,
    });
  }

  const lnxReward = REWARDS[adType] || 3;

  // 3-minute cooldown between rewarded ads
  const COOLDOWN_MS = 3 * 60 * 1000;
  if (adType === 'rewarded_video' || adType === 'referral_unlock') {
    const last = cooldowns.get(uid) || 0;
    const wait = COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) return res.status(429).json({
      error: `Wait ${Math.ceil(wait / 1000)}s before next ad.`,
      waitSeconds: Math.ceil(wait / 1000),
    });
    cooldowns.set(uid, Date.now());
  }

  // 15 rewarded ads/day max
  const dayKey = `${uid}_${new Date().toISOString().slice(0, 10)}`;
  const count  = dailyCounts.get(dayKey) || 0;
  if (adType === 'rewarded_video' && count >= 15) {
    return res.status(429).json({
      error: 'Daily limit reached (15 ads/day). Try tomorrow!',
      limitReached: true, dailyCount: count, dailyLimit: 15,
    });
  }
  dailyCounts.set(dayKey, count + 1);

  // Referral unlock — needs 2 completed ads
  let referralAdsWatched = null, referralUnlocked = false;
  if (adType === 'referral_unlock') {
    const watched = (referralAds.get(uid) || 0) + 1;
    referralAds.set(uid, watched);
    referralAdsWatched = watched;
    referralUnlocked = watched >= 2;
    if (referralUnlocked) referralAds.delete(uid);
  }

  return res.status(200).json({
    success: true, lnxReward, adType,
    platform: platform || 'web',
    dailyCount: count + 1, dailyLimit: 15,
    referralAdsWatched, referralUnlocked,
    platformShare: '70%', userShare: '30%',
    message: `+${lnxReward} LNX earned!`,
  });
}
