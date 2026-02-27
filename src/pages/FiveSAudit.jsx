import { useState, useRef } from "react";
import FeedbackInput from "../components/feedback/FeedbackInput";
import IterationBadge from "../components/feedback/IterationBadge";
import LoadingState from "../components/shared/LoadingState";
import ActionButtons from "../components/shared/ActionButtons";
import { analyze } from "../lib/api";
import { saveResult } from "../lib/storage";
import { resizeImage } from "../lib/camera";

const LOADING_TEXTS = [
  "Arbeitsbereich wird analysiert...",
  "5S-Kriterien werden geprüft...",
  "Bewertung wird erstellt...",
];

const FEEDBACK_CHIPS = [
  { label: "Bereich genauer prüfen", text: "Bitte prüfe folgenden Bereich genauer: " },
  { label: "Standards vorschlagen", text: "Bitte schlage konkrete Standards vor für " },
  { label: "Prioritäten setzen", text: "Bitte priorisiere die Maßnahmen nach Aufwand und Wirkung." },
];

function scoreColor(score) {
  if (score > 4) return "text-green-400";
  if (score >= 2.5) return "text-yellow-400";
  return "text-red-400";
}

function dotColor(status) {
  if (status === "green") return "bg-green-400";
  if (status === "yellow") return "bg-yellow-400";
  return "bg-red-400";
}

export default function FiveSAudit({ onBack }) {
  const [phase, setPhase] = useState("input");
  const [image, setImage] = useState(null);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState("scorecard");
  const [iteration, setIteration] = useState(1);
  const [previousResult, setPreviousResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fileRef = useRef(null);

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resized = await resizeImage(reader.result);
        setImage(resized);
      } catch {
        // skip
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function runAnalysis(feedbackText) {
    setPhase("processing");
    setError(null);

    try {
      const res = await analyze({
        feature: "5s",
        input: context || "Analysiere den Arbeitsbereich nach 5S-Kriterien.",
        image,
        previous_result: previousResult,
        feedback: feedbackText || null,
        iteration,
      });
      console.log("[5S] API response:", res);
      setResult(res);
      setExpanded({});
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase(result ? "result" : "input");
    }
  }

  function handleFeedback(text) {
    setPreviousResult(JSON.stringify(result));
    setIteration((i) => i + 1);
    runAnalysis(text);
  }

  function handleSave() {
    saveResult({ feature: "5s", title: "5S Audit", ...result });
    setSaved(true);
  }

  async function handleShare() {
    const cats = (result?.categories || [])
      .map((c) => `${c.name}: ${c.score}/5 ${c.status === "green" ? "\u2705" : c.status === "yellow" ? "\u{1F7E1}" : "\u{1F534}"}\n${(c.findings || []).map((f) => "  - " + f).join("\n")}`)
      .join("\n\n");

    const recs = (result?.recommendations || []).map((r) => "- " + r).join("\n");

    const text = `5S Audit\nGesamtbewertung: ${result?.score}/5.0\n\n${cats}\n\nEmpfehlungen:\n${recs}`;

    if (navigator.share) {
      try { await navigator.share({ title: "5S Audit", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  function toggleExpand(index) {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function resetAll() {
    setPhase("input");
    setImage(null);
    setContext("");
    setResult(null);
    setViewMode("scorecard");
    setIteration(1);
    setPreviousResult(null);
    setSaved(false);
    setError(null);
    setExpanded({});
  }

  return (
    <div className="px-4 pt-2 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={phase === "result" ? resetAll : onBack}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-100">5S Audit</h1>
          <div className="h-0.5 w-12 rounded-full mt-1" style={{ backgroundColor: "#34D399" }} />
        </div>
        {phase === "result" && <IterationBadge iteration={iteration} />}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── INPUT PHASE ── */}
      {phase === "input" && (
        <div className="space-y-5">
          {/* Photo */}
          {image ? (
            <div>
              <img
                src={`data:image/jpeg;base64,${image}`}
                alt="Arbeitsbereich"
                className="w-full rounded-2xl border border-zinc-800 object-cover max-h-64"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full mt-3 h-12 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 active:scale-[0.98] transition-transform"
              >
                Anderes Foto
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#34D399" }}
            >
              <span className="text-lg">{"\u{1F4F7}"}</span>
              Arbeitsbereich fotografieren
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />

          {/* Context */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Bereich (optional)</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="z.B. Montage Station 3"
              className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => runAnalysis()}
            disabled={!image}
            className="w-full h-14 rounded-xl font-bold text-base text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#34D399" }}
          >
            5S Audit starten
          </button>
        </div>
      )}

      {/* ── PROCESSING PHASE ── */}
      {phase === "processing" && <LoadingState texts={LOADING_TEXTS} />}

      {/* ── RESULT PHASE ── */}
      {phase === "result" && result && (
        <div className="space-y-4">
          {/* Photo */}
          {image && (
            <img
              src={`data:image/jpeg;base64,${image}`}
              alt="Arbeitsbereich"
              className="w-full rounded-2xl border border-zinc-800 object-cover max-h-40"
            />
          )}

          {/* Score */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-5xl font-bold ${scoreColor(result.score || 0)}`}>
                {result.score ?? "–"}
              </span>
              <span className="text-xl text-zinc-500 font-medium">/ 5.0</span>
            </div>
            <p className="text-zinc-400 text-sm mt-1">Gesamtbewertung</p>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("scorecard")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "scorecard"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              }`}
            >
              Scorecard
            </button>
            <button
              onClick={() => setViewMode("actions")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "actions"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              }`}
            >
              Maßnahmenliste
            </button>
          </div>

          {/* Scorecard view */}
          {viewMode === "scorecard" && (
            <div className="space-y-2">
              {(result.categories || []).map((cat, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleExpand(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left"
                  >
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor(cat.status)}`} />
                    <span className="flex-1 text-sm text-zinc-200">{cat.name}</span>
                    <span className={`text-sm font-bold ${scoreColor(cat.score || 0)}`}>{cat.score}</span>
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${expanded[i] ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{ maxHeight: expanded[i] ? "500px" : "0px" }}
                  >
                    <div className="px-4 pb-3 pt-0 border-t border-zinc-800">
                      {(cat.findings || []).map((finding, fi) => (
                        <p key={fi} className="text-zinc-400 text-sm py-1 flex gap-2">
                          <span className="text-zinc-600">•</span>
                          {finding}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions view */}
          {viewMode === "actions" && (
            <div className="space-y-2">
              {(result.categories || []).flatMap((cat) =>
                (cat.findings || []).map((f) => ({ category: cat.name, finding: f, status: cat.status }))
              ).map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotColor(item.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 text-sm">{item.finding}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Empfehlungen</h3>
              <div className="space-y-2">
                {result.recommendations.map((text, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-emerald-400 text-sm mt-0.5">{"\u25B6"}</span>
                    <p className="text-zinc-200 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Feedback</h3>
            <FeedbackInput onSubmit={handleFeedback} disabled={phase === "processing"} />
          </div>

          {/* Actions */}
          <ActionButtons onSave={handleSave} onShare={handleShare} saved={saved} />

          {/* New audit */}
          <button
            onClick={resetAll}
            className="w-full h-14 rounded-xl font-semibold text-sm bg-zinc-900 text-zinc-400 border border-zinc-800 active:scale-[0.98] transition-transform"
          >
            Neues Audit
          </button>
        </div>
      )}
    </div>
  );
}
