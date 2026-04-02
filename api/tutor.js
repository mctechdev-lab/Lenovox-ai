// ================================================================
// api/tutor.js — Lenovox Smart Tutor  (Production)
// YouTube Data API v3 (primary) → Invidious (fallback, free)
// ================================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { query, mode, aiPrefs } = req.body;
  if (!query) return res.status(400).json({ error: 'query required.' });

  const USD_TO_LNX = 12903;
  const MODEL = 'gpt-4o-mini';
  const IN_M = 0.15, OUT_M = 0.60;

  // ── EXPLAIN ─────────────────────────────────────────────────
  if (!mode || mode === 'explain') {
    const tone = aiPrefs?.tone || 'friendly';
    const level = aiPrefs?.eduLevel || 'secondary';
    const context = aiPrefs?.context || '';
    const system = `You are Lenovox Smart Tutor, an expert educational AI for Nigerian students. Tone: ${tone}. Level: ${level}.${context ? ' Student context: ' + context : ''} Give a thorough explanation with ## headings, examples relevant to Nigerian students, and **bold** key points. Format in clean markdown. End with a brief summary.`;
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: MODEL, max_tokens: 1800, temperature: 0.6, messages: [{ role: 'system', content: system }, { role: 'user', content: `Explain thoroughly: ${query}` }] }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); return res.status(r.status).json({ error: e.error?.message || 'AI error' }); }
      const data = await r.json();
      const inTok = data.usage?.prompt_tokens || 0;
      const outTok = data.usage?.completion_tokens || 0;
      const lnx = Math.min(Math.max(5, Math.ceil(((inTok / 1e6) * IN_M + (outTok / 1e6) * OUT_M) * USD_TO_LNX)), 30);
      return res.status(200).json({ content: data.choices?.[0]?.message?.content || '', usage: { inputTokens: inTok, outputTokens: outTok, lnxCost: lnx, modelUsed: 'GPT-4o Mini' } });
    } catch { return res.status(500).json({ error: 'AI service unavailable.' }); }
  }

  // ── VIDEOS — YouTube API primary, Invidious fallback ─────────
  if (mode === 'videos') {
    const q = query + ' tutorial explained';
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      try {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=6&relevanceLanguage=en&key=${ytKey}`, { signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const data = await r.json();
          const videos = (data.items || []).map(v => ({ videoId: v.id?.videoId, title: v.snippet?.title, author: v.snippet?.channelTitle, videoThumbnails: [{ url: v.snippet?.thumbnails?.medium?.url }] })).filter(v => v.videoId);
          if (videos.length) return res.status(200).json({ videos });
        }
      } catch {}
    }
    const instances = ['https://inv.tux.pizza', 'https://invidious.nerdvpn.de', 'https://invidious.privacyredirect.com'];
    for (const base of instances) {
      try {
        const r = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance`, { signal: AbortSignal.timeout(4000) });
        if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return res.status(200).json({ videos: d.slice(0, 6) }); }
      } catch { continue; }
    }
    return res.status(200).json({ videos: [] });
  }

  // ── QUIZ ──────────────────────────────────────────────────────
  if (mode === 'quiz') {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: MODEL, max_tokens: 1000, temperature: 0.5, messages: [{ role: 'system', content: 'Quiz generator. Return ONLY valid JSON array. No markdown.' }, { role: 'user', content: `Based on "${query}", generate 5 MCQs. Format: [{"q":"question","options":["A. opt","B. opt","C. opt","D. opt"],"answer":"A","explain":"why"}]` }] }),
      });
      if (!r.ok) return res.status(200).json({ questions: [] });
      const data = await r.json();
      const raw = (data.choices?.[0]?.message?.content || '[]').replace(/```json|```/g, '').trim();
      const questions = JSON.parse(raw);
      return res.status(200).json({ questions: Array.isArray(questions) ? questions : [] });
    } catch { return res.status(200).json({ questions: [] }); }
  }

  return res.status(400).json({ error: 'Invalid mode. Use: explain | videos | quiz' });
}
