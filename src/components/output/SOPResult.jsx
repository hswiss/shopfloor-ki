import { useRef } from "react";
import html2canvas from "html2canvas";
import { tap } from "../../lib/haptics";

const FORMAT_OPTIONS = [
  { id: "steps", label: "Schritte" },
  { id: "checklist", label: "Checkliste" },
  { id: "prose", label: "Text" },
  { id: "short", label: "Kurz" },
];

function docNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const n = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `SOP-${y}-${n}`;
}

function todayString() {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Merge multiple SOPs into one flat step list with section dividers
function buildMergedSteps(chain, currentSop) {
  const allSops = chain && chain.length > 0 ? [...chain, currentSop] : [currentSop];
  if (allSops.length === 1) return { sections: null, steps: currentSop?.steps || [] };

  const sections = [];
  let globalNr = 1;
  for (const sop of allSops) {
    const mapped = (sop.steps || []).map((s) => ({ ...s, nr: globalNr++, sectionTitle: null }));
    if (mapped.length > 0) {
      mapped[0].sectionTitle = sop.title || null;
    }
    sections.push(...mapped);
  }
  return { sections: allSops.map((s) => s.title), steps: sections };
}

export default function SOPResult({
  sop,
  chain,
  format,
  onFormatChange,
  checkedSteps,
  onToggleStep,
  iteration,
  meta,
}) {
  const docRef = useRef(null);

  if (!sop) return null;

  const { steps } = buildMergedSteps(chain, sop);
  const allSops = chain && chain.length > 0 ? [...chain, sop] : [sop];
  const totalTime = allSops.reduce((s, x) => s + (x.total_time_min || 0), 0);
  const allTools = [...new Set(allSops.flatMap((x) => x.tools_needed || []))];
  const allMaterials = [...new Set(allSops.flatMap((x) => x.materials_needed || []))];
  const allSafety = [...new Set(allSops.flatMap((x) => x.safety_notes || []))];
  const allPrereqs = [...new Set(allSops.flatMap((x) => x.prerequisites || []))];
  const checkedCount = Object.values(checkedSteps || {}).filter(Boolean).length;

  function handleFormat(id) {
    tap();
    onFormatChange(id);
  }

  async function handleScreenshot() {
    if (!docRef.current) return;
    const el = docRef.current;

    // Temporarily switch to print mode
    el.classList.add("sop-print-mode");
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#f4f4f5",
        scale: 2,
        useCORS: true,
      });
      el.classList.remove("sop-print-mode");

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "arbeitsanweisung.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: sop.title || "Arbeitsanweisung" }); } catch { /* cancelled */ }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "arbeitsanweisung.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch {
      el.classList.remove("sop-print-mode");
    }
  }

  return (
    <div>
      {/* Document */}
      <div ref={docRef} className="sop-document bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

        {/* ─── HEADER ─── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Arbeitsanweisung</p>
            <p className="text-[10px] font-mono text-zinc-500">{docNumber()}</p>
          </div>
          <h2 className="text-lg font-bold text-zinc-100 mt-1">{sop.title || "Arbeitsanweisung"}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
            <div>
              <span className="text-zinc-500">Bereich: </span>
              <span className="text-zinc-300">{meta?.area || sop.category || "\u2014"}</span>
            </div>
            <div>
              <span className="text-zinc-500">Erstellt: </span>
              <span className="text-zinc-300">{todayString()}</span>
            </div>
            <div>
              <span className="text-zinc-500">Version: </span>
              <span className="text-zinc-300">v{iteration || 1}</span>
            </div>
            <div>
              <span className="text-zinc-500">Erstellt von: </span>
              <span className="text-zinc-300">{meta?.author || "\u2014"}</span>
            </div>
            {meta?.machine && (
              <div className="col-span-2">
                <span className="text-zinc-500">Bauteil/Maschine: </span>
                <span className="text-zinc-300">{meta.machine}</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: "#FF6B2C" }} />

        {/* ─── SAFETY ─── */}
        {allSafety.length > 0 && (
          <div className="mx-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">{"\u26A0\uFE0F"} Sicherheitshinweise</p>
            {allSafety.map((note, i) => (
              <p key={i} className="text-amber-300/90 text-sm">{note}</p>
            ))}
          </div>
        )}

        {/* ─── STEPS ─── */}
        <div className="px-4 py-4">
          {/* Checklist progress bar */}
          {format === "checklist" && steps.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span>{checkedCount} von {steps.length} Schritten erledigt</span>
                <span>{steps.length > 0 ? Math.round((checkedCount / steps.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${steps.length > 0 ? (checkedCount / steps.length) * 100 : 0}%`,
                    backgroundColor: "#FF6B2C",
                  }}
                />
              </div>
            </div>
          )}

          {format === "steps" && <StepsView steps={steps} />}
          {format === "checklist" && <ChecklistView steps={steps} checked={checkedSteps} onToggle={onToggleStep} />}
          {format === "prose" && <ProseView sop={sop} steps={steps} />}
          {format === "short" && <ShortView steps={steps} />}
        </div>

        {/* ─── SUMMARY ─── */}
        {format !== "short" && (allTools.length > 0 || allMaterials.length > 0 || totalTime > 0) && (
          <div className="border-t-2 border-orange-500 mx-4 mb-4 pt-4">
            <div className="grid grid-cols-3 gap-3">
              {/* Tools */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Werkzeuge</p>
                {allTools.length > 0 ? (
                  <div className="space-y-1">
                    {allTools.map((t, i) => (
                      <p key={i} className="text-zinc-300 text-xs">{t}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs">{"\u2014"}</p>
                )}
              </div>
              {/* Materials */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Hilfsmittel</p>
                {allMaterials.length > 0 ? (
                  <div className="space-y-1">
                    {allMaterials.map((m, i) => (
                      <p key={i} className="text-zinc-300 text-xs">{m}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs">{"\u2014"}</p>
                )}
              </div>
              {/* Time */}
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Gesamtzeit</p>
                <p className="text-2xl font-bold text-zinc-100">{totalTime || "\u2014"}</p>
                {totalTime > 0 && <p className="text-zinc-500 text-xs">Minuten</p>}
              </div>
            </div>
            {allPrereqs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Voraussetzungen</p>
                {allPrereqs.map((p, i) => (
                  <p key={i} className="text-zinc-300 text-xs">{"\u2022"} {p}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── FOOTER ─── */}
        <div className="px-5 py-2 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 text-center">
            Erstellt mit Shopfloor KI {"\u00B7"} {todayString()} {"\u00B7"} v{iteration || 1}
          </p>
        </div>
      </div>

      {/* Screenshot button */}
      <button
        onClick={handleScreenshot}
        className="w-full mt-3 h-12 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 active:scale-[0.98] transition-transform"
      >
        {"\u{1F4F8}"} Als Bild speichern
      </button>

      {/* Format switcher */}
      <div className="flex gap-2 mt-3">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleFormat(opt.id)}
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

/* ─── STEP VIEWS ─── */

function StepRow({ step, children }) {
  return (
    <>
      {step.sectionTitle && (
        <div className="pt-3 pb-2 flex items-center gap-2">
          <div className="h-px flex-1 bg-zinc-700" />
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">{step.sectionTitle}</span>
          <div className="h-px flex-1 bg-zinc-700" />
        </div>
      )}
      <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
        {children}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF6B2C" }}>
          <span className="text-sm font-bold text-white">{step.nr}</span>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-zinc-100 text-sm font-semibold">{step.action}</p>
          {(step.tools?.length > 0 || step.materials?.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {(step.tools || []).map((t, i) => (
                <span key={`t${i}`} className="bg-zinc-800 rounded-full px-2 py-0.5 text-[11px] text-zinc-400">{"\u{1F527}"} {t}</span>
              ))}
              {(step.materials || []).map((m, i) => (
                <span key={`m${i}`} className="bg-zinc-700/50 rounded-full px-2 py-0.5 text-[11px] text-zinc-400">{"\u{1F4E6}"} {m}</span>
              ))}
            </div>
          )}
          {step.safety && (
            <p className="text-orange-400/80 text-xs">{"\u26A0\uFE0F"} {step.safety}</p>
          )}
          {step.notes && (
            <p className="text-zinc-500 text-xs italic">{step.notes}</p>
          )}
        </div>
        {step.time_min && (
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold text-zinc-300">{step.time_min}</p>
            <p className="text-[10px] text-zinc-500">min</p>
          </div>
        )}
      </div>
    </>
  );
}

function StepsView({ steps }) {
  if (!steps || steps.length === 0) return <EmptySteps />;
  return (
    <div>
      {steps.map((step) => (
        <StepRow key={step.nr} step={step} />
      ))}
    </div>
  );
}

function ChecklistView({ steps, checked = {}, onToggle }) {
  if (!steps || steps.length === 0) return <EmptySteps />;
  return (
    <div>
      {steps.map((step) => (
        <StepRow key={step.nr} step={step}>
          <button
            onClick={() => { tap(); onToggle?.(step.nr); }}
            className="flex-shrink-0 mt-2"
          >
            <span
              className={`w-6 h-6 rounded border-2 flex items-center justify-center text-sm transition-colors ${
                checked[step.nr]
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-zinc-600 text-transparent"
              }`}
            >
              {"\u2713"}
            </span>
          </button>
        </StepRow>
      ))}
    </div>
  );
}

function ProseView({ sop, steps }) {
  if (!steps || steps.length === 0) return <EmptySteps />;

  const prose = steps.map((s) => {
    let text = `Schritt ${s.nr}: ${s.action}`;
    if (s.time_min) text += ` (ca. ${s.time_min} Minuten)`;
    if (s.tools?.length) text += `. Werkzeuge: ${s.tools.join(", ")}`;
    if (s.materials?.length) text += `. Hilfsmittel: ${s.materials.join(", ")}`;
    if (s.safety) text += `. Achtung: ${s.safety}`;
    return text + ".";
  });

  return (
    <div className="text-zinc-300 text-sm leading-relaxed space-y-2">
      {prose.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function ShortView({ steps }) {
  if (!steps || steps.length === 0) return <EmptySteps />;
  const short = steps.slice(0, 5);
  return (
    <div className="space-y-1">
      {short.map((step) => (
        <div key={step.nr} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF6B2C" }}>
            <span className="text-xs font-bold text-white">{step.nr}</span>
          </div>
          <p className="text-zinc-100 text-sm">{step.action}</p>
        </div>
      ))}
      {steps.length > 5 && (
        <p className="text-zinc-500 text-xs text-center pt-2">+ {steps.length - 5} weitere Schritte</p>
      )}
    </div>
  );
}

function EmptySteps() {
  return (
    <div className="py-8 text-center">
      <p className="text-zinc-500 text-sm">Keine Schritte vorhanden</p>
    </div>
  );
}
