export async function analyze({ feature, input, image, images, preset, category, previous_result, feedback, iteration }) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature,
        input: input || "Analysiere die Daten.",
        image: image || null,
        images: images || null,
        preset: preset || null,
        category: category || null,
        previous_result: previous_result || null,
        feedback: feedback || null,
        iteration: iteration || 1,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server-Fehler (${res.status})`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.success) {
      throw new Error(data.error || "Analyse fehlgeschlagen");
    }

    return data.result;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Keine Verbindung zum Server. Bitte Internetverbindung prüfen.");
    }
    throw new Error(err.message || "Ein unbekannter Fehler ist aufgetreten.");
  }
}
