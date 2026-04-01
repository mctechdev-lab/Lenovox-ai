// ================================================================
// api/getData.js — Lenovox AI Gateway  (Production)
// Provider : OpenAI  (GPT-4o-mini / GPT-4o / GPT-4-turbo / o1-mini)
// Cost     : Token-based  →  LNX = ceil(totalUSD × 12903)
// ================================================================
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { messages, model = 'fast', systemPrompt, uid } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages required.' });

  const USD_TO_LNX = 12903; // 1 USD ≈ ₦1,600 ÷ 0.124

  const MODELS = {
    fast:     { id: 'gpt-4o-mini',  label: 'GPT-4o Mini',  inM: 0.15,   outM: 0.60,   cap: 20  },
    smart:    { id: 'gpt-4o',       label: 'GPT-4o',       inM: 2.50,   outM: 10.00,  cap: 120 },
    advanced: { id: 'gpt-4-turbo',  label: 'GPT-4 Turbo',  inM: 10.00,  outM: 30.00,  cap: 300 },
    premium:  { id: 'o1-mini',      label: 'o1-mini',      inM: 3.00,   outM: 12.00,  cap: 150 },
  };

  const m = MODELS[model] ?? MODELS.fast;

  const system = systemPrompt ||
    `You are Lenovox AI, a helpful and intelligent AI assistant built into the Lenovox learning platform.
Help users learn, solve problems, write code, and think through complex topics.
Be clear, concise, and educational. Format responses in clean markdown.
Never reveal your underlying model name — you are Lenovox AI, created by MC Tech.`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: m.id,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e.error?.message || 'OpenAI API error.' });
    }

    const data = await r.json();
    const inTok  = data.usage?.prompt_tokens     ?? 0;
    const outTok = data.usage?.completion_tokens ?? 0;
    const usd    = (inTok / 1_000_000) * m.inM + (outTok / 1_000_000) * m.outM;
    const lnx    = Math.min(Math.max(1, Math.ceil(usd * USD_TO_LNX)), m.cap);

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content ?? '',
      usage: { inputTokens: inTok, outputTokens: outTok, lnxCost: lnx, modelUsed: m.label },
    });
  } catch (e) {
    return res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
}
