const SYSTEM_PROMPTS = {
  sop: `Du bist ein erfahrener Produktionsleiter in der Montage. Du erstellst professionelle Arbeitsanweisungen (SOPs) aus mündlichen oder schriftlichen Beschreibungen. Der Input kann umgangssprachlich und dialektgefärbt sein - das ist normal. Mache daraus eine klare, strukturierte Anweisung.

ANTWORTE IMMER als valides JSON ohne Markdown-Backticks:
{
  "title": "Titel der Arbeitsanweisung",
  "category": "Montage",
  "steps": [{"nr": 1, "action": "Beschreibung", "time_min": 5, "tools": ["13mm Ring-Maulschlüssel"], "materials": ["Dichtungsmasse"], "safety": "Schutzbrille tragen", "notes": null}],
  "total_time_min": 45,
  "tools_needed": ["alle Werkzeuge"],
  "materials_needed": ["alle Hilfsmittel"],
  "safety_notes": ["Allgemeine Sicherheitshinweise"],
  "prerequisites": ["Was muss vorher erledigt sein"]
}`,

  "5s": `Du bist ein 5S-Auditor in der Produktion. Du analysierst Fotos von Arbeitsbereichen nach den 5S-Kriterien. Sei konkret und praxisnah in deinen Befunden.

ANTWORTE IMMER als valides JSON ohne Markdown-Backticks:
{
  "score": 3.2,
  "categories": [
    {"name": "Sortieren (Seiri)", "score": 4, "status": "green", "findings": ["Keine unnötigen Gegenstände"]},
    {"name": "Systematisieren (Seiton)", "score": 2, "status": "red", "findings": ["Keine Ordnungsstruktur"]},
    {"name": "Säubern (Seiso)", "score": 3, "status": "yellow", "findings": ["Teilweise verschmutzt"]},
    {"name": "Standardisieren (Seiketsu)", "score": 2, "status": "red", "findings": ["Keine Beschriftungen"]},
    {"name": "Selbstdisziplin (Shitsuke)", "score": 3, "status": "yellow", "findings": ["Nicht konsequent"]}
  ],
  "recommendations": ["Shadow Board einführen", "Stellplatz-Markierungen anbringen"]
}`,

  data_multimoment: `Du bist ein erfahrener Lean-Berater und Produktionsexperte. Du analysierst Fotos von handschriftlichen Multimomentaufnahme-Strichlisten aus der Produktion.

Die Strichlisten haben diese EXAKTEN 6 Kategorien:
1. Wertschöpfung (wertschöpfende Tätigkeit)
2. Rüsten/Reinigen
3. Warten an Maschinen & Anlagen
4. Suchen, Laufen o. Transportieren
5. Schreibarbeit/EDV
6. Gespräche führen & persönliche Verteilzeit

Jede Zeile hat: Datum, Uhrzeit, dann Striche (IIII = 4, IIII I = 5) pro Kategorie, und eine Summe.
Wenn mehrere Fotos geschickt werden, sind das verschiedene Zettel von verschiedenen Beobachtern. Kombiniere ALLE Daten.

ANTWORTE IMMER als valides JSON ohne Markdown-Backticks:
{
  "title": "Multimomentaufnahme [Bereich/Datum]",
  "summary": "Kurze Zusammenfassung in 2 Sätzen",
  "measurements": [{"time": "13:25", "date": "16.09.", "data": {"Wertschöpfung": 10, "Rüsten": 3, "Warten": 0, "Suchen/Laufen": 20, "EDV": 2, "Gespräche": 4}}],
  "totals": {"Wertschöpfung": 54, "Rüsten": 5, "Warten": 0, "Suchen/Laufen": 91, "EDV": 17, "Gespräche": 42},
  "percentages": {"Wertschöpfung": 25.8, "Rüsten": 2.4, "Warten": 0, "Suchen/Laufen": 43.5, "EDV": 8.1, "Gespräche": 20.1},
  "total_observations": 209,
  "value_add_percent": 25.8,
  "waste_percent": 74.2,
  "insights": ["Nur 25.8% wertschöpfend", "Suchen/Laufen ist größter Treiber mit 43.5%"],
  "recommendations": ["Material näher an Arbeitsplatz lagern", "Spaghetti-Diagramm erstellen"]
}`,
};

function getSystemPrompt(feature, preset) {
  if (feature === "data" && preset === "multimoment") {
    return SYSTEM_PROMPTS.data_multimoment;
  }
  return SYSTEM_PROMPTS[feature] || null;
}

function buildUserContent({ input, image, images, previous_result, feedback, iteration }) {
  const content = [];

  // Add images (single or multiple)
  if (images && images.length > 0) {
    for (const img of images) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: img },
      });
    }
  } else if (image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: image },
    });
  }

  // Build text with optional iteration context
  let text = input;
  if (iteration > 1 && previous_result && feedback) {
    text =
      `Vorheriges Ergebnis:\n${previous_result}\n\n` +
      `Feedback vom Nutzer:\n${feedback}\n\n` +
      `Bitte überarbeite das Ergebnis basierend auf dem Feedback.\n\n` +
      `Ursprüngliche Anfrage:\n${input}`;
  }

  content.push({ type: "text", text });

  return content;
}

function parseResult(data) {
  const textBlock = data.content && data.content.find((b) => b.type === "text");
  if (!textBlock) return { raw: data };

  try {
    return JSON.parse(textBlock.text);
  } catch {
    return { raw: textBlock.text };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ error: "Method not allowed" });
  }

  const { feature, input, image, images, feedback, previous_result, iteration, category, preset } =
    req.body || {};

  if (!feature || !input) {
    return res.status(200).json({ error: "feature and input required" });
  }

  const systemPrompt = getSystemPrompt(feature, preset);
  if (!systemPrompt) {
    return res.status(200).json({ error: `Unknown feature: ${feature}` });
  }

  try {
    const userContent = buildUserContent({
      input,
      image,
      images,
      previous_result,
      feedback,
      iteration: iteration || 1,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ success: false, error: data.error.message || data.error });
    }

    const parsed = parseResult(data);
    return res.status(200).json({ success: true, result: parsed });
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
}
