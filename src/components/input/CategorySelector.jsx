import { tap } from "../../lib/haptics";

const CATEGORIES = [
  { id: "montage", label: "Montage", emoji: "\u{1F527}" },
  { id: "wartung", label: "Wartung", emoji: "\u2699\uFE0F" },
  { id: "pruefung", label: "Prüfung", emoji: "\u2705" },
  { id: "sonstiges", label: "Sonstiges", emoji: "\u2728" },
];

export default function CategorySelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CATEGORIES.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            onClick={() => { tap(); onChange(c.id); }}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 min-h-[56px] transition-colors border ${
              active
                ? "bg-orange-500/15 border-orange-500/40 text-zinc-100"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}
          >
            <span className="text-lg">{c.emoji}</span>
            <span className="text-xs font-medium">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
