export default function SOPChain({ chain, activeIndex, onSelect, onAddNew }) {
  if (!chain || chain.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">SOP-Kette</h3>
      <div className="space-y-2">
        {chain.map((sop, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors border ${
              i === activeIndex
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-zinc-900 border-zinc-800"
            }`}
          >
            <span className="flex-shrink-0 text-xs font-mono text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded">
              SOP-{String(i + 1).padStart(3, "0")}
            </span>
            <span className="flex-1 text-sm text-zinc-200 truncate">
              {sop.title || `Arbeitsschritt ${i + 1}`}
            </span>
            <span className="text-sm">{"\u2705"}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onAddNew}
        className="w-full mt-2 h-12 rounded-xl text-sm font-medium text-orange-400 border border-dashed border-orange-500/30 bg-orange-500/5 active:scale-[0.98] transition-transform"
      >
        + Weiteren Arbeitsschritt
      </button>
    </div>
  );
}
