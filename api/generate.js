res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") return res.status(200).end();
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { kind, topic } = req.body || {};
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const prompt =
      kind === "tiktok"
        ? `Tulis skrip TikTok 30–45 saat dalam Bahasa Melayu tentang ${topic}.
Mulakan dengan ayat provok atau shocking statement.
Fokus kepada point paling penting sahaja.
Gaya santai macam borak dengan kawan.
Akhir sekali letak CTA: “Follow untuk lebih banyak tech info.”`
        : `Tulis skrip YouTube dalam Bahasa Melayu tentang ${topic}.
Mulakan dengan hook yang kuat dalam 15 saat pertama.
Terangkan spesifikasi utama (kalau sesuai), kelebihan dan kekurangan.
Bandingkan dari segi harga dan performance (1080p/1440p kalau berkaitan).
Gaya santai tapi professional.
Akhiri dengan kesimpulan + siapa patut beli/pilih.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY env var" });

    // Using Responses API (recommended for new projects) :contentReference[oaicite:1]{index=1}
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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

    // Responses API returns content in an output array; "output_text" is commonly present.
    const text =
      json.output_text ||
      (json.output?.[0]?.content || [])
        .map((c) => c.text || "")
        .join("")
        .trim();

    return res.status(200).json({ text: text || "(Empty response)" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
