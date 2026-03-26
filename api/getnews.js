// /api/getnews.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key missing' });

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?language=en&pageSize=30&apiKey=${apiKey}`
    );
    const data = await response.json();

    // News API returns 'articles' array
    if (!data.articles) return res.status(500).json({ error: 'Invalid response from API' });

    res.status(200).json(data.articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
