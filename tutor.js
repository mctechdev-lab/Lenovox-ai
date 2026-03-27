// ================================================================
// api/tutor.js — Lenovox Smart Tutor Serverless Function
// 1. Generates AI explanation via OpenAI
// 2. Searches YouTube via Invidious (free, no API key)
// 3. Generates quiz questions from the AI response
// Token-based LNX cost. Search costs 10 LNX. Videos cost 5 LNX each.
// ================================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { query, mode, uid, aiPrefs } = req.body;
  // mode: 'explain' | 'quiz' | 'videos'

  if (!query) return res.status(400).json({ error: 'query is required.' });

  const USD_TO_LNX = 12903;
  // GPT-4o-mini for cost efficiency on Smart Tutor
  const MODEL = 'gpt-4o-mini';
  const IN_PER_1M  = 0.15;
  const OUT_PER_1M = 0.60;

  // ── MODE: EXPLAIN ─────────────────────────────────────────────
  if (mode === 'explain' || !mode) {
    const tone     = aiPrefs?.tone     || 'friendly';
    const level    = aiPrefs?.eduLevel || 'sss';
    const context  = aiPrefs?.context  || '';
    const subjects = aiPrefs?.subjects || '';

    const system = `You are Lenovox Smart Tutor, an expert educational AI. 
Tone: ${tone}. Student level: ${level}. ${subjects ? 'Their subjects: ' + subjects + '.' : ''}
${context ? 'About student: ' + context : ''}
Give a thorough, well-structured explanation with:
- Clear headings using ##
- Concrete examples relevant to Nigerian students
- Key points highlighted with **bold**
- A brief summary at the end
Format in clean markdown. End with the exact text: QUIZ_READY`;

    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: MODEL, max_tokens: 1800, temperature: 0.6,
          messages: [{ role: 'system', content: system }, { role: 'user', content: `Explain this topic thoroughly: ${query}` }] }),
      });
      if (!r.ok) { const e=await r.json(); return res.status(r.status).json({ error: e.error?.message || 'AI error' }); }
      const data = await r.json();
      const inTok  = data.usage?.prompt_tokens     || 0;
      const outTok = data.usage?.completion_tokens || 0;
      const rawLNX = ((inTok / 1_000_000) * IN_PER_1M + (outTok / 1_000_000) * OUT_PER_1M) * USD_TO_LNX;
      const lnxCost = Math.min(Math.max(5, Math.ceil(rawLNX)), 30);
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace('QUIZ_READY', '').trim();
      return res.status(200).json({ content, usage: { inputTokens: inTok, outputTokens: outTok, lnxCost, modelUsed: 'GPT-4o Mini' } });
    } catch (e) {
      return res.status(500).json({ error: 'AI service unavailable.' });
    }
  }

  // ── MODE: VIDEOS ──────────────────────────────────────────────
  if (mode === 'videos') {
    try {
      // Try multiple Invidious instances for reliability
      const instances = [
        'https://inv.tux.pizza',
        'https://invidious.nerdvpn.de',
        'https://invidious.privacyredirect.com',
      ];
      let videos = [];
      for (const base of instances) {
        try {
          const r = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(query + ' tutorial explanation')}&type=video&sort_by=relevance`, { signal: AbortSignal.timeout(4000) });
          if (r.ok) { const d = await r.json(); videos = Array.isArray(d) ? d.slice(0, 6) : []; break; }
        } catch { continue; }
      }
      return res.status(200).json({ videos });
    } catch (e) {
      return res.status(200).json({ videos: [] });
    }
  }

  // ── MODE: QUIZ ────────────────────────────────────────────────
  if (mode === 'quiz') {
    const { aiExplanation } = req.body;
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: MODEL, max_tokens: 1000, temperature: 0.5,
          messages: [
            { role: 'system', content: 'You are a quiz generator. Return ONLY a valid JSON array. No markdown. No backticks. No extra text whatsoever.' },
            { role: 'user', content: `Based on this explanation about "${query}":\n\n${(aiExplanation || '').slice(0, 1500)}\n\nGenerate exactly 5 multiple-choice quiz questions. Format: [{"q":"question","options":["A. opt","B. opt","C. opt","D. opt"],"answer":"A","explain":"why"}]` }
          ],
        }),
      });
      if (!r.ok) return res.status(200).json({ questions: [] });
      const data = await r.json();
      let raw = data.choices?.[0]?.message?.content || '[]';
      raw = raw.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(raw);
      return res.status(200).json({ questions: Array.isArray(questions) ? questions : [] });
    } catch (e) {
      return res.status(200).json({ questions: [] });
    }
  }

  return res.status(400).json({ error: 'Invalid mode. Use: explain | videos | quiz' });
}
