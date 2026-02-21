export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET")
    return res.status(200).json({ ok: true, message: "API is running. Use POST." });

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });

    const { kind, topic } = req.body || {};
    if (!topic)
      return res.status(400).json({ error: "Missing topic" });

    const prompt =
      kind === "tiktok"
        ? `Tulis skrip TikTok 30–45 saat dalam Bahasa Melayu tentang ${topic}.
Mulakan dengan ayat provok.
Gaya santai macam borak dengan kawan.
Akhiri dengan CTA.`
        : `Tulis skrip YouTube dalam Bahasa Melayu tentang ${topic}.
Mulakan dengan hook kuat.
Terangkan pro & cons.
Bandingkan harga dan performance.
Akhiri dengan kesimpulan.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "(No output)";

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
