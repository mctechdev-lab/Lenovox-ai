// /api/image.js
export default async function handler(req, res) {
  // Only allow POST requests for consistency
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;
  const searchQuery = query || "educational technology";
  const apiKey = process.env.PIXABAY2_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Pixabay API Key (PIXABAY2_API_KEY) not configured." });
  }

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&image_type=photo&per_page=6`;
    const response = await fetch(url);
    const data = await response.json();

    const images = data.hits.map(hit => ({
      url: hit.largeImageURL,
      description: hit.tags,
      preview: hit.previewURL
    }));

    res.status(200).json({ images });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images" });
  }
}
