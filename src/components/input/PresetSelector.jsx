import { tap } from "../../lib/haptics";

const PRESETS = [
  { id: "multimoment", label: "Multimoment-\naufnahme", emoji: "\u23F0" },
  { id: "fehler", label: "Fehler-\nStrichliste", emoji: "\u274C" },
  { id: "wastewalk", label: "Wastewalk-\nDaten", emoji: "\u{1F440}" },
  { id: "freitext", label: "Freitext", emoji: "\u270F\uFE0F" },
];

export default function PresetSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((p) => {
        const active = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => { tap(); onSelect(p.id); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 min-h-[56px] text-left transition-colors border ${
              active
                ? "bg-blue-500/15 border-blue-500/40 text-zinc-100"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}
          >
            <span className="text-xl flex-shrink-0">{p.emoji}</span>
            <span className="text-sm font-medium leading-tight whitespace-pre-line">
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
