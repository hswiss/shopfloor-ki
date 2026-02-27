const FORMAT_OPTIONS = [
  { id: "steps", label: "Schritte" },
  { id: "checklist", label: "Checkliste" },
  { id: "prose", label: "Text" },
  { id: "short", label: "Kurz" },
];

export default function SOPResult({ sop, format, onFormatChange, checkedSteps, onToggleStep }) {
  if (!sop) return null;

  return (
    <div>
      {/* Title + Meta */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-100">{sop.title || "Arbeitsanweisung"}</h2>
        <div className="flex items-center gap-2 mt-2">
          {sop.category && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
              {sop.category}
            </span>
          )}
          {sop.total_time_min && (
            <span className="text-zinc-400 text-sm">{"\u23F1"} {sop.total_time_min} Min. gesamt</span>
          )}
        </div>
      </div>

      {/* Content by format */}
      {format === "steps" && <StepsView steps={sop.steps} />}
      {format === "checklist" && (
        <ChecklistView steps={sop.steps} checked={checkedSteps} onToggle={onToggleStep} />
      )}
      {format === "prose" && <ProseView sop={sop} />}
      {format === "short" && <ShortView steps={sop.steps} />}

      {/* Summary box */}
      {format !== "short" && <SummaryBox sop={sop} />}

      {/* Format switcher */}
      <div className="flex gap-2 mt-4">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onFormatChange(opt.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              format === opt.id
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-orange-500 rounded-2xl p-4">
      <div className="flex gap-3">
        <span className="text-2xl font-bold text-orange-500 leading-none mt-0.5">
          {step.nr}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          {children}
          <p className="text-zinc-100 text-sm font-medium">{step.action}</p>
          {step.time_min && (
            <p className="text-zinc-400 text-xs">{"\u23F0"} {step.time_min} Min.</p>
          )}
          {step.tools && step.tools.length > 0 && (
            <p className="text-zinc-400 text-xs">{"\u{1F527}"} {step.tools.join(", ")}</p>
          )}
          {step.materials && step.materials.length > 0 && (
            <p className="text-zinc-400 text-xs">{"\u{1F4E6}"} {step.materials.join(", ")}</p>
          )}
          {step.safety && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              <p className="text-red-400 text-xs">{"\u26A0\uFE0F"} {step.safety}</p>
            </div>
          )}
          {step.notes && (
            <p className="text-zinc-500 text-xs italic">{step.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepsView({ steps }) {
  if (!steps || steps.length === 0) return <EmptySteps />;
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <StepCard key={step.nr} step={step} />
      ))}
    </div>
  );
}

function ChecklistView({ steps, checked = {}, onToggle }) {
  if (!steps || steps.length === 0) return <EmptySteps />;
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <StepCard key={step.nr} step={step}>
          <button
            onClick={() => onToggle?.(step.nr)}
            className="flex items-center gap-2 mb-1"
          >
            <span
              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                checked[step.nr]
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-zinc-600 text-transparent"
              }`}
            >
              {"\u2713"}
            </span>
            <span className={`text-xs font-medium ${checked[step.nr] ? "text-orange-400" : "text-zinc-500"}`}>
              {checked[step.nr] ? "Erledigt" : "Offen"}
            </span>
          </button>
        </StepCard>
      ))}
    </div>
  );
}

function ProseView({ sop }) {
  const steps = sop.steps || [];
  if (steps.length === 0) return <EmptySteps />;

  const prose = steps.map((s) => {
    let text = `Schritt ${s.nr}: ${s.action}`;
    if (s.time_min) text += ` (ca. ${s.time_min} Minuten)`;
    if (s.tools?.length) text += `. Benötigte Werkzeuge: ${s.tools.join(", ")}`;
    if (s.materials?.length) text += `. Hilfsmittel: ${s.materials.join(", ")}`;
    if (s.safety) text += `. Sicherheitshinweis: ${s.safety}`;
    return text + ".";
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h3 className="text-zinc-100 font-semibold text-sm mb-3">{sop.title}</h3>
      <div className="text-zinc-300 text-sm leading-relaxed space-y-2">
        {prose.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function ShortView({ steps }) {
  if (!steps || steps.length === 0) return <EmptySteps />;
  const short = steps.slice(0, 5);
  return (
    <div className="space-y-2">
      {short.map((step) => (
        <div key={step.nr} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <span className="text-lg font-bold text-orange-500">{step.nr}</span>
          <p className="text-zinc-100 text-sm">{step.action}</p>
        </div>
      ))}
      {steps.length > 5 && (
        <p className="text-zinc-500 text-xs text-center">+ {steps.length - 5} weitere Schritte</p>
      )}
    </div>
  );
}

function SummaryBox({ sop }) {
  const hasTools = sop.tools_needed?.length > 0;
  const hasMaterials = sop.materials_needed?.length > 0;
  const hasSafety = sop.safety_notes?.length > 0;
  const hasPrereqs = sop.prerequisites?.length > 0;

  if (!hasTools && !hasMaterials && !hasSafety && !hasPrereqs && !sop.total_time_min) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Zusammenfassung</h3>
      {sop.total_time_min && (
        <p className="text-zinc-300 text-sm">{"\u23F1"} Gesamtzeit: <span className="text-zinc-100 font-semibold">{sop.total_time_min} Minuten</span></p>
      )}
      {hasTools && (
        <div>
          <p className="text-zinc-400 text-xs font-medium mb-1">{"\u{1F527}"} Werkzeuge</p>
          <p className="text-zinc-300 text-sm">{sop.tools_needed.join(", ")}</p>
        </div>
      )}
      {hasMaterials && (
        <div>
          <p className="text-zinc-400 text-xs font-medium mb-1">{"\u{1F4E6}"} Hilfsmittel</p>
          <p className="text-zinc-300 text-sm">{sop.materials_needed.join(", ")}</p>
        </div>
      )}
      {hasSafety && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          <p className="text-red-400 text-xs font-medium mb-1">{"\u26A0\uFE0F"} Sicherheitshinweise</p>
          {sop.safety_notes.map((note, i) => (
            <p key={i} className="text-red-300 text-sm">{note}</p>
          ))}
        </div>
      )}
      {hasPrereqs && (
        <div>
          <p className="text-zinc-400 text-xs font-medium mb-1">Voraussetzungen</p>
          {sop.prerequisites.map((p, i) => (
            <p key={i} className="text-zinc-300 text-sm">• {p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySteps() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-8 text-center">
      <p className="text-zinc-500 text-sm">Keine Schritte vorhanden</p>
    </div>
  );
}
