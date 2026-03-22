export default async function handler(req, res) {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "No query provided" });
  }

  try {
    // OpenAI API Call
    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // you can replace with GPT-5 if needed
        messages: [{ role: "user", content: query }],
        max_tokens: 500
      })
    });

    const openaiData = await openaiResp.json();

    // YouTube API Call
    const ytResp = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`
    );

    const ytData = await ytResp.json();

    // Send both results to frontend
    return res.status(200).json({
      ai_response: openaiData,
      youtube_videos: ytData
    });

  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong",
      details: error.message
    });
  }
      }
