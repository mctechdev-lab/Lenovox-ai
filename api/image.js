// ================================================================
// api/image.js — Lenovox Vision  (Production)
// Provider : OpenAI GPT-4o Vision
// ================================================================
export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { imageBase64, mediaType, prompt } = req.body;
  if (!imageBase64 || !mediaType) return res.status(400).json({ error: 'imageBase64 + mediaType required.' });

  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED.includes(mediaType)) return res.status(400).json({ error: 'Unsupported image type.' });

  const USD_TO_LNX = 12903;
  const IN_M = 2.50, OUT_M = 10.00, CAP = 150, MIN = 5;

  const userPrompt = prompt?.trim() ||
    'Describe this image in detail. If it has text extract it all. If it shows a maths problem solve it step by step. If it is a diagram explain it clearly.';

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: 'You are Lenovox AI. Analyse images, extract text, solve maths problems, explain diagrams. Be clear and educational.' },
          { role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageBase64}`, detail: 'high' } },
            { type: 'text', text: userPrompt },
          ]},
        ],
      }),
    });

    if (!r.ok) { const e = await r.json().catch(() => ({})); return res.status(r.status).json({ error: e.error?.message || 'Vision error.' }); }

    const data  = await r.json();
    const inTok  = data.usage?.prompt_tokens     ?? 0;
    const outTok = data.usage?.completion_tokens ?? 0;
    const usd    = (inTok / 1_000_000) * IN_M + (outTok / 1_000_000) * OUT_M;
    const lnx    = Math.min(Math.max(MIN, Math.ceil(usd * USD_TO_LNX)), CAP);

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content ?? '',
      usage: { inputTokens: inTok, outputTokens: outTok, lnxCost: lnx, modelUsed: 'GPT-4o Vision' },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Image analysis failed. Please try again.' });
  }
}
