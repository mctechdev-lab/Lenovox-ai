// ================================================================
// api/image.js — Lenovox Vision API (OpenAI GPT-4o Vision)
// Accepts base64 image + optional prompt → analysis + LNX cost
// Daily limit enforced client-side (2/day via localStorage)
// ================================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { imageBase64, mediaType, prompt, uid } = req.body;
  if (!imageBase64 || !mediaType)
    return res.status(400).json({ error: 'imageBase64 and mediaType are required.' });

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(mediaType))
    return res.status(400).json({ error: 'Unsupported image type. Use JPG, PNG, GIF or WEBP.' });

  const USD_TO_LNX  = 12903;
  const IN_PER_1M   = 2.50;   // GPT-4o input pricing
  const OUT_PER_1M  = 10.00;  // GPT-4o output pricing
  const LNX_CAP     = 150;
  const LNX_MIN     = 5;

  const userPrompt = prompt?.trim() ||
    'Describe this image in detail. If it contains text extract all of it. If it shows a maths problem solve it step by step. If it is a diagram or chart explain it clearly.';

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: 'You are Lenovox AI. Analyse images, extract text, solve visible maths problems, explain diagrams and describe scenes. Be clear and educational.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              { type: 'text', text: userPrompt },
            ],
          },
        ],
      }),
    });

    if (!r.ok) {
      const err = await r.json();
      return res.status(r.status).json({ error: err.error?.message || 'Vision API error' });
    }

    const data     = await r.json();
    const inTok    = data.usage?.prompt_tokens     || 0;
    const outTok   = data.usage?.completion_tokens || 0;
    const rawUSD   = (inTok / 1_000_000) * IN_PER_1M + (outTok / 1_000_000) * OUT_PER_1M;
    const lnxCost  = Math.min(Math.max(LNX_MIN, Math.ceil(rawUSD * USD_TO_LNX)), LNX_CAP);

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content || '',
      usage: { inputTokens: inTok, outputTokens: outTok, lnxCost, modelUsed: 'GPT-4o Vision' },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Image analysis failed. Please try again.' });
  }
}
