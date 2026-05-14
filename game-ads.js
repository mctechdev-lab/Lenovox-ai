// ================================================================
// game-ads.js — Shared Rewarded Ad System for ALL Lenovox Games
// Import this in every game file
// ================================================================

const AD_CLIENT = 'ca-pub-6229569177818177';
const AD_COOLDOWN_MS = 30 * 60 * 1000;
const AD_REWARD_LNX = 30;
const AD_DURATION_SECS = 30;

let _adTimer = null;
let _adSecs = 0;
let _adResolve = null;
let _db = null;
let _uid = null;

export function initAds(db, uid) {
  _db = db; _uid = uid; injectAdHTML();
}

export function setAdUser(uid) { _uid = uid; }

export function showRewardedAd() {
  return new Promise((resolve) => {
    _adResolve = resolve;
    const last = parseInt(localStorage.getItem('lnx_last_ad') || '0');
    const elapsed = Date.now() - last;
    if (elapsed < AD_COOLDOWN_MS) {
      const m = Math.ceil((AD_COOLDOWN_MS - elapsed) / 60000);
      showAdToast(`Next ad in ${m} min`, 'info'); resolve(0); return;
    }
    _adSecs = AD_DURATION_SECS;
    document.getElementById('_lnxAdOverlay').classList.add('show');
    document.getElementById('_adCount').textContent = _adSecs;
    document.getElementById('_adProgFill').style.width = '0%';
    document.getElementById('_adSkipBtn').className = 'lnx-ad-skip';
    document.getElementById('_adSkipBtn').textContent = `Skip in ${_adSecs}s`;
    document.getElementById('_adRewardAmt').textContent = AD_REWARD_LNX;
    try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
    clearInterval(_adTimer);
    _adTimer = setInterval(() => {
      _adSecs--;
      document.getElementById('_adCount').textContent = _adSecs;
      document.getElementById('_adProgFill').style.width = ((AD_DURATION_SECS-_adSecs)/AD_DURATION_SECS*100)+'%';
      if (_adSecs <= 0) {
        clearInterval(_adTimer);
        const b = document.getElementById('_adSkipBtn');
        b.className = 'lnx-ad-skip ready';
        b.textContent = `🎉 Claim ${AD_REWARD_LNX} LNX!`;
      } else {
        document.getElementById('_adSkipBtn').textContent = `Skip in ${_adSecs}s`;
      }
    }, 1000);
  });
}

export function isAdAvailable() {
  return Date.now() - parseInt(localStorage.getItem('lnx_last_ad')||'0') >= AD_COOLDOWN_MS;
}

export function minsUntilNextAd() {
  const r = AD_COOLDOWN_MS - (Date.now() - parseInt(localStorage.getItem('lnx_last_ad')||'0'));
  return r > 0 ? Math.ceil(r/60000) : 0;
}

async function handleAdClaim() {
  if (_adSecs > 0) { showAdToast('Watch the full ad first!', 'error'); return; }
  clearInterval(_adTimer);
  document.getElementById('_lnxAdOverlay').classList.remove('show');
  let earned = 0;
  if (_uid && _db) {
    try {
      const { doc, updateDoc, addDoc, collection, increment, serverTimestamp } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(_db,'wallets',_uid),{balance:increment(AD_REWARD_LNX),totalEarned:increment(AD_REWARD_LNX)});
      await updateDoc(doc(_db,'users',_uid),{lnxBalance:increment(AD_REWARD_LNX)});
      await addDoc(collection(_db,'wallets',_uid,'transactions'),{type:'Ad Reward',amount:AD_REWARD_LNX,timestamp:serverTimestamp()});
      localStorage.setItem('lnx_last_ad', Date.now().toString());
      earned = AD_REWARD_LNX;
      showAdToast(`🎉 +${AD_REWARD_LNX} LNX earned!`, 'success');
    } catch(e) { showAdToast('Error crediting coins','error'); }
  }
  if (_adResolve) { _adResolve(earned); _adResolve = null; }
}

function injectAdHTML() {
  if (document.getElementById('_lnxAdOverlay')) return;
  const style = document.createElement('style');
  style.textContent = `
    #_lnxAdOverlay{position:fixed;inset:0;z-index:99999;background:rgba(3,3,11,.97);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;font-family:'Nunito',sans-serif}
    #_lnxAdOverlay.show{display:flex}
    .lnx-ad-icon{width:76px;height:76px;border-radius:22px;background:linear-gradient(135deg,#facc15,#f97316);display:flex;align-items:center;justify-content:center;font-size:2.2rem;animation:lnxAdPulse 1.1s ease infinite alternate;box-shadow:0 10px 32px rgba(250,204,21,.35)}
    @keyframes lnxAdPulse{from{transform:scale(1)}to{transform:scale(1.08)}}
    .lnx-ad-title{font-family:'Orbitron',monospace;font-size:1.1rem;font-weight:900;text-align:center;color:#fff}
    .lnx-ad-reward{font-family:'Orbitron',monospace;font-size:2rem;font-weight:900;color:#facc15}
    .lnx-ad-reward span{font-size:1rem;color:#888}
    .lnx-ad-sub{color:#555;font-size:.82rem;text-align:center;max-width:270px;line-height:1.6}
    .lnx-ad-count{font-family:'Orbitron',monospace;font-size:1.6rem;font-weight:900;color:#fff}
    .lnx-ad-prog-wrap{width:100%;max-width:300px;height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
    #_adProgFill{height:100%;border-radius:4px;background:linear-gradient(90deg,#facc15,#f97316);width:0%;transition:width .1s linear}
    .lnx-ad-unit{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;width:100%;max-width:320px;min-height:140px;display:flex;align-items:center;justify-content:center;color:#333;font-size:.75rem;text-align:center;padding:14px}
    .lnx-ad-skip{padding:11px 28px;border:none;border-radius:13px;font-family:'Nunito',sans-serif;font-size:.88rem;font-weight:800;cursor:not-allowed;transition:.3s;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#444}
    .lnx-ad-skip.ready{background:linear-gradient(135deg,#10b981,#059669);color:#fff;cursor:pointer;border-color:transparent;box-shadow:0 6px 20px rgba(16,185,129,.35);animation:lnxBounce .6s ease infinite alternate}
    @keyframes lnxBounce{from{transform:translateY(0)}to{transform:translateY(-4px)}}
    #_adToastContainer{position:fixed;top:60px;right:14px;z-index:999999;display:flex;flex-direction:column;gap:7px;max-width:250px}
    .lnx-ad-toast{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;font-size:.8rem;font-weight:700;background:rgba(10,10,20,.97);border:1px solid rgba(255,255,255,.08);animation:lnxToastIn .3s ease}
    @keyframes lnxToastIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    .lnx-ad-toast.removing{animation:lnxToastOut .25s ease forwards}
    @keyframes lnxToastOut{to{transform:translateX(110%);opacity:0}}
  `;
  document.head.appendChild(style);
  const d = document.createElement('div');
  d.innerHTML = `
    <div id="_lnxAdOverlay">
      <div class="lnx-ad-icon">📺</div>
      <div class="lnx-ad-title">Watch Ad · Earn Coins!</div>
      <div class="lnx-ad-reward"><span id="_adRewardAmt">${AD_REWARD_LNX}</span> LNX <span>coins</span></div>
      <div class="lnx-ad-sub">A short ad supports Lenovox AI and earns you coins!</div>
      <div class="lnx-ad-count" id="_adCount">30</div>
      <div class="lnx-ad-prog-wrap"><div id="_adProgFill"></div></div>
      <div class="lnx-ad-unit">
        <div style="text-align:center">
          <div style="font-size:2rem;margin-bottom:8px">📢</div>
          <div style="color:#444;margin-bottom:8px;font-size:.75rem">Advertisement</div>
          <ins class="adsbygoogle" style="display:inline-block;width:280px;height:100px"
            data-ad-client="${AD_CLIENT}" data-ad-slot="YOUR_REWARDED_AD_SLOT_ID"
            data-ad-format="auto" data-full-width-responsive="true"></ins>
        </div>
      </div>
      <button class="lnx-ad-skip" id="_adSkipBtn" onclick="window._lnxClaimAd()">Skip in 30s</button>
    </div>
    <div id="_adToastContainer"></div>`;
  document.body.appendChild(d);
  window._lnxClaimAd = handleAdClaim;
}

function showAdToast(msg, type='success') {
  const c = document.getElementById('_adToastContainer');
  if(!c) return;
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  const el=document.createElement('div');el.className='lnx-ad-toast';
  el.innerHTML=`<span>${icons[type]||'•'}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(()=>{el.classList.add('removing');setTimeout(()=>el.remove(),260);},3500);
}
