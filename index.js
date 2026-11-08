import { createServer } from 'http';

export default async function handler(req, res) {
  // 1. Agar user Web Page open kare toh HTML Render karo
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="ur">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Chatbot Test</title>
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 15px; }
              .chat-card { width: 100%; max-width: 480px; height: 85vh; max-height: 650px; background: #131c2e; border: 1px solid #1e2d4a; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
              .header { padding: 16px; background: #1a263d; border-bottom: 1px solid #243556; text-align: center; }
              .header h2 { font-size: 1.1rem; font-weight: 600; color: #60a5fa; }
              .messages-box { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
              .msg { max-width: 82%; padding: 10px 14px; border-radius: 12px; font-size: 0.95rem; line-height: 1.4; word-wrap: break-word; }
              .user { background: #2563eb; color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; }
              .bot { background: #1e293b; color: #e2e8f0; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #334155; }
              .input-area { padding: 12px; background: #1a263d; border-top: 1px solid #243556; display: flex; gap: 8px; }
              input { flex: 1; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; outline: none; font-size: 0.95rem; }
              input:focus { border-color: #3b82f6; }
              button { background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
              button:hover { background: #1d4ed8; }
          </style>
      </head>
      <body>

      <div class="chat-card">
          <div class="header">
              <h2>OpenRouter AI Test Assistant</h2>
          </div>
          <div class="messages-box" id="chatBox">
              <div class="msg bot">Salam! Main test AI Assistant hoon. Koi bhi sawal poochhein!</div>
          </div>
          <div class="input-area">
              <input type="text" id="userMsg" placeholder="Apna paigham likhein..." onkeydown="if(event.key==='Enter') send()" />
              <button onclick="send()">Send</button>
          </div>
      </div>

      <script>
          async function send() {
              const input = document.getElementById('userMsg');
              const box = document.getElementById('chatBox');
              const text = input.value.trim();

              if (!text) return;

              // Append User Message
              box.innerHTML += \`<div class="msg user">\${escapeHtml(text)}</div>\`;
              input.value = '';
              box.scrollTop = box.scrollHeight;

              // Append Bot Loading State
              const tempId = 'bot-' + Date.now();
              box.innerHTML += \`<div class="msg bot" id="\${tempId}">Soch raha hai...</div>\`;
              box.scrollTop = box.scrollHeight;

              try {
                  const res = await fetch('/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: text })
                  });

                  const data = await res.json();
                  const reply = data.reply || data.error || "Aapki request process nahi ho saki.";
                  document.getElementById(tempId).innerText = reply;
              } catch (err) {
                  document.getElementById(tempId).innerText = "Server connection error.";
              }
              box.scrollTop = box.scrollHeight;
          }

          function escapeHtml(str) {
              return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
      </script>

      </body>
      </html>
    `);
  }

  // 2. Clear API Call handler (Hidden OpenRouter Backend Request)
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body || '{}');
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(500).json({ error: 'Server configuration error: OpenRouter API key missing.' });
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
            model: "openrouter/free", // Completely free model router
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await openRouterRes.json();
        const aiResponse = data.choices?.[0]?.message?.content || "AI response generated null content.";

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ reply: aiResponse });

      } catch (err) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ error: "Failed to query OpenRouter API." });
      }
    });
  }
}
