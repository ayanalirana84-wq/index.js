export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body || {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API Key Missing in Environment Variables.' });
    }

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "Vercel Test Chatbot"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await openRouterRes.json();
    const aiResponse = data.choices?.[0]?.message?.content || "AI response generated null content.";

    return res.status(200).json({ reply: aiResponse });

  } catch (err) {
    return res.status(500).json({ error: "Failed to query OpenRouter API." });
  }
}
