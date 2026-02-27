import { useState } from "react";

const SUGGESTIONS = [
  { label: "Wert korrigieren", text: "Bitte korrigiere folgenden Wert: " },
  { label: "Genauer analysieren", text: "Bitte analysiere die Daten genauer, insbesondere " },
  { label: "Was-wäre-wenn", text: "Was wäre wenn wir " },
];

export default function FeedbackInput({ onSubmit, disabled }) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
  }

  return (
    <div>
      {/* Suggestion chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => setText(s.text)}
            disabled={disabled}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input + Send */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Korrektur oder Frage eingeben..."
          disabled={disabled}
          className="flex-1 h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="h-12 px-4 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: "#60A5FA" }}
        >
          Senden
        </button>
      </div>
    </div>
  );
}
