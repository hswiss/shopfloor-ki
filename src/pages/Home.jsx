export default function Home({ onNavigate }) {
  const features = [
    {
      id: "sop",
      emoji: "\u{1F4CB}",
      title: "SOP Builder",
      description: "Arbeitsanweisung erstellen",
      accent: "#FF6B2C",
    },
    {
      id: "fives",
      emoji: "\u2705",
      title: "5S Audit",
      description: "Arbeitsplatz pr\u00FCfen",
      accent: "#34D399",
    },
    {
      id: "data",
      emoji: "\u{1F4CA}",
      title: "Daten-Analyse",
      description: "Strichlisten auswerten",
      accent: "#60A5FA",
    },
  ];

  return (
    <div className="px-4 pt-2 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Shopfloor KI</h1>
        <p className="text-zinc-400 text-sm">Lean Workshop Tool</p>
      </div>

      {/* Feature Cards */}
      <div className="flex flex-col gap-3">
        {features.map((f) => (
          <button
            key={f.id}
            onClick={() => onNavigate(f.id)}
            className="flex items-center gap-4 w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 min-h-[80px] text-left active:scale-[0.98] transition-transform"
          >
            {/* Emoji with accent background */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: f.accent + "1A" }}
            >
              {f.emoji}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-zinc-100 font-semibold text-base">{f.title}</p>
              <p className="text-zinc-400 text-sm">{f.description}</p>
            </div>

            {/* Arrow */}
            <svg
              className="flex-shrink-0 w-5 h-5 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* History Section */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Letzte Ergebnisse
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-6 text-center">
          <p className="text-zinc-500 text-sm">Noch keine gespeicherten Ergebnisse</p>
        </div>
      </div>
    </div>
  );
}
