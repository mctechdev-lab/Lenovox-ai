// ================================================================
// api/imagine.js — Lenovox AI Imagine  (Production)
// Uses Pixabay API for real stock image results.
// Replace with DALL-E when OpenAI image generation budget is ready.
// ================================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { prompt, ratio = '1:1' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required.' });

  const key = process.env.PIXABAY_API_KEY;
  if (!key) return res.status(500).json({ error: 'PIXABAY_API_KEY not configured.' });

  // Map ratio to orientation
  const orientations = { '1:1': 'horizontal', '2:3': 'vertical', '9:16': 'vertical', '3:2': 'horizontal' };
  const orientation = orientations[ratio] || 'horizontal';

  // Clean prompt for search — take first 4 words
  const searchQuery = prompt
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('+');

  try {
    const r = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${searchQuery}&image_type=photo&orientation=${orientation}&per_page=6&safesearch=true&min_width=400`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) throw new Error('Pixabay API error');
    const data = await r.json();

    const images = (data.hits || []).map(h => ({
      url:       h.webformatURL,
      largeUrl:  h.largeImageURL,
      thumb:     h.previewURL,
      width:     h.webformatWidth,
      height:    h.webformatHeight,
      tags:      h.tags,
      user:      h.user,
      pixabayUrl: h.pageURL,
    }));

    return res.status(200).json({
      images,
      total: data.totalHits || 0,
      prompt,
      note: 'Images from Pixabay. DALL-E integration available when enabled.',
    });
  } catch (e) {
    return res.status(500).json({ error: 'Image search failed. Please try again.' });
  }
}
