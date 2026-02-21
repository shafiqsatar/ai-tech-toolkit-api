export default async function handler(req, res) {
  // ---- CORS (important for github.io frontend)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Allow simple GET check (so opening in browser doesn't crash)
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "API is running. Use POST." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY on Vercel Environment Variables",
      });
    }

    const { kind, topic } = req.body || {};
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing topic" });
    }

    const prompt =
      kind === "tiktok"
        ? `Tulis skrip TikTok 30–45 saat dalam Bahasa Melayu tentang ${topic}.
Mulakan dengan ayat provok atau shocking statement.
Fokus point paling penting sahaja.
Gaya santai macam borak dengan kawan.
Akhir sekali CTA: “Follow untuk lebih banyak tech info.”`
        : `Tulis skrip YouTube dalam Bahasa Melayu tentang ${topic}.
Mulakan dengan hook kuat dalam 15 saat pertama.
Terangkan spesifikasi (kalau sesuai), pro & cons.
Bandingkan harga dan performance (1080p/1440p kalau berkaitan).
Gaya santai tapi professional.
Akhiri dengan kesimpulan + siapa patut pilih.`;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).send(t);
    }

    const json = await r.json();

    const text =
      json.output_text ||
      (json.output?.[0]?.content || []).map((c) => c.text || "").join("").trim();

    return res.status(200).json({ text: text || "(Empty response)" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
