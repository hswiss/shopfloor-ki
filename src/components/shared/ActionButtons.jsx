export default function ActionButtons({ onSave, onShare, saved }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onSave}
        disabled={saved}
        className={`flex-1 h-14 rounded-xl font-semibold text-sm transition-colors ${
          saved
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-emerald-600 text-white active:scale-[0.98]"
        }`}
      >
        {saved ? "\u2713 Gespeichert" : "Speichern"}
      </button>
      <button
        onClick={onShare}
        className="flex-1 h-14 rounded-xl font-semibold text-sm bg-zinc-800 text-zinc-300 border border-zinc-700 active:scale-[0.98] transition-transform"
      >
        Teilen
      </button>
    </div>
  );
}
