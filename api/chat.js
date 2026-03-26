// /api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message } = req.body;
  const apiKey = process.env.OPENAI2_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ reply: "API Key (OPENAI2_API_KEY) not configured in Vercel." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a friendly and helpful AI tutor for students. Explain concepts clearly and simply." },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ reply: "Error connecting to AI service." });
  }
}
