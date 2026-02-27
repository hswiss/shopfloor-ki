import { useState, useRef } from "react";
import PresetSelector from "../components/input/PresetSelector";
import BatchCamera from "../components/input/BatchCamera";
import DataChart from "../components/output/DataChart";
import FeedbackInput from "../components/feedback/FeedbackInput";
import IterationBadge from "../components/feedback/IterationBadge";
import LoadingState from "../components/shared/LoadingState";
import ActionButtons from "../components/shared/ActionButtons";
import { analyze } from "../lib/api";
import { saveResult } from "../lib/storage";
import { success } from "../lib/haptics";

const LOADING_TEXTS = [
  "Strichlisten werden erkannt...",
  "Daten werden analysiert...",
  "Diagramm wird erstellt...",
];

function scoreColor(pct) {
  if (pct >= 50) return "#34D399";
  if (pct >= 30) return "#FBBF24";
  return "#EF4444";
}

export default function DataAnalysis({ onBack, savedResult }) {
  const resultRef = useRef(null);
  const [phase, setPhase] = useState(savedResult ? "result" : "input");
  const [images, setImages] = useState([]);
  const [preset, setPreset] = useState("multimoment");
  const [context, setContext] = useState("");
  const [result, setResult] = useState(savedResult || null);
  const [chartFormat, setChartFormat] = useState("bar");
  const [iteration, setIteration] = useState(1);
  const [previousResult, setPreviousResult] = useState(null);
  const [saved, setSaved] = useState(!!savedResult);
  const [error, setError] = useState(null);

  async function runAnalysis(feedbackText) {
    setPhase("processing");
    setError(null);

    try {
      const res = await analyze({
        feature: "data",
        input: context || "Analysiere die Strichlisten.",
        images,
        preset,
        previous_result: previousResult,
        feedback: feedbackText || null,
        iteration,
      });
      console.log("[DATA] API response:", res);
      setResult(res);
      setPhase("result");
      success();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
    saveResult({ feature: "data", title: result?.title, ...result });
    setSaved(true);
  }

  async function handleShare() {
    const text = `${result?.title || "Daten-Analyse"}\n\nWertschöpfung: ${result?.value_add_percent}%\nVerschwendung: ${result?.waste_percent}%\nBeobachtungen: ${result?.total_observations}\n\n${(result?.insights || []).join("\n")}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: result?.title || "Daten-Analyse", text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  function resetAll() {
    setPhase("input");
    setImages([]);
    setPreset("multimoment");
    setContext("");
    setResult(null);
    setChartFormat("bar");
    setIteration(1);
    setPreviousResult(null);
    setSaved(false);
    setError(null);
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
          <h1 className="text-xl font-bold text-zinc-100">Daten-Analyse</h1>
          <div className="h-0.5 w-12 rounded-full mt-1" style={{ backgroundColor: "#60A5FA" }} />
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
          {/* Preset */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Datentyp wählen</label>
            <PresetSelector selected={preset} onSelect={setPreset} />
          </div>

          {/* Camera */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Strichlisten fotografieren</label>
            <BatchCamera images={images} onImagesChange={setImages} />
          </div>

          {/* Context */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">
              Kontext (optional)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="z.B. Montage Station 3, Frühschicht"
              className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => runAnalysis()}
            disabled={images.length === 0}
            className="w-full h-14 rounded-xl font-bold text-base text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#60A5FA" }}
          >
            Auswerten
          </button>
        </div>
      )}

      {/* ── PROCESSING PHASE ── */}
      {phase === "processing" && <LoadingState texts={LOADING_TEXTS} />}

      {/* ── RESULT PHASE ── */}
      {phase === "result" && result && (
        <div ref={resultRef} className="space-y-4">
          {/* Hero stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <p className="text-4xl font-bold" style={{ color: scoreColor(result.value_add_percent || 0) }}>
              {result.value_add_percent ?? "–"}% Wertschöpfung
            </p>
            <p className="text-xl text-red-400 font-semibold mt-1">
              {result.waste_percent ?? "–"}% Verschwendung
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Basierend auf {result.total_observations ?? "–"} Beobachtungen
            </p>
          </div>

          {/* Chart */}
          <DataChart
            percentages={result.percentages}
            totals={result.totals}
            format={chartFormat}
            onFormatChange={setChartFormat}
          />

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Erkenntnisse</h3>
              <div className="space-y-2">
                {result.insights.map((text, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-200 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Empfehlungen</h3>
              <div className="space-y-2">
                {result.recommendations.map((text, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-blue-400 text-sm mt-0.5">{"\u25B6"}</span>
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

          {/* New analysis */}
          <button
            onClick={resetAll}
            className="w-full h-14 rounded-xl font-semibold text-sm bg-zinc-900 text-zinc-400 border border-zinc-800 active:scale-[0.98] transition-transform"
          >
            Neue Analyse
          </button>
        </div>
      )}
    </div>
  );
}
