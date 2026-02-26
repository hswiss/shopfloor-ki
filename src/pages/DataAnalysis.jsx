export default function DataAnalysis({ onBack }) {
  return (
    <div className="px-4 pt-2 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Daten-Analyse</h1>
          <div className="h-0.5 w-12 rounded-full mt-1" style={{ backgroundColor: "#60A5FA" }} />
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-16 text-center">
        <p className="text-4xl mb-4">{"\u{1F4CA}"}</p>
        <p className="text-zinc-400 text-base">Hier entsteht die Daten-Analyse</p>
        <p className="text-zinc-500 text-sm mt-2">Strichlisten und Daten auswerten</p>
      </div>
    </div>
  );
}
