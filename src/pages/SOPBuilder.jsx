import { useState, useRef } from "react";
import CategorySelector from "../components/input/CategorySelector";
import VoiceInput from "../components/input/VoiceInput";
import SOPResult from "../components/output/SOPResult";
import FeedbackInput from "../components/feedback/FeedbackInput";
import IterationBadge from "../components/feedback/IterationBadge";
import LoadingState from "../components/shared/LoadingState";
import ActionButtons from "../components/shared/ActionButtons";
import { analyze } from "../lib/api";
import { saveResult } from "../lib/storage";
import { resizeImage } from "../lib/camera";
import { success } from "../lib/haptics";

const LOADING_TEXTS = [
  "Sprache wird verarbeitet...",
  "Arbeitsschritte werden erkannt...",
  "SOP wird erstellt...",
];

export default function SOPBuilder({ onBack, savedResult }) {
  const [phase, setPhase] = useState(savedResult ? "result" : "input");
  const [category, setCategory] = useState("montage");
  const [inputText, setInputText] = useState("");
  const [inputImage, setInputImage] = useState(null);
  const [result, setResult] = useState(savedResult || null);
  const [sopFormat, setSopFormat] = useState("steps");
  const [iteration, setIteration] = useState(1);
  const [previousResult, setPreviousResult] = useState(null);
  const [saved, setSaved] = useState(!!savedResult);
  const [error, setError] = useState(null);
  const [chain, setChain] = useState([]);
  const [checkedSteps, setCheckedSteps] = useState({});

  // Document metadata (optional fields user can fill in)
  const [meta, setMeta] = useState({
    area: "",
    author: "",
    machine: "",
  });
  const [showMeta, setShowMeta] = useState(false);

  const fileRef = useRef(null);
  const resultRef = useRef(null);

  // Voice input
  const preVoiceText = useRef(null);

  function handleTranscript(text, isFinal) {
    if (preVoiceText.current === null) {
      preVoiceText.current = inputText;
    }
    const prefix = preVoiceText.current ? preVoiceText.current + " " : "";
    setInputText(prefix + text);
    if (isFinal) {
      preVoiceText.current = null;
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resized = await resizeImage(reader.result);
        setInputImage(resized);
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
        feature: "sop",
        input: inputText,
        image: inputImage,
        category,
        previous_result: previousResult,
        feedback: feedbackText || null,
        iteration,
      });
      console.log("[SOP] API response:", res);
      setResult(res);
      setCheckedSteps({});
      setPhase("result");
      success();

      // Pre-fill meta from KI result
      if (iteration === 1 && !feedbackText) {
        setMeta((prev) => ({
          area: prev.area || res.category || "",
          author: prev.author,
          machine: prev.machine || "",
        }));
        setShowMeta(true);
      }

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
    const allSops = chain.length > 0 ? [...chain, result] : [result];
    saveResult({
      feature: "sop",
      title: result?.title || "Arbeitsanweisung",
      chain: allSops,
      meta,
      ...result,
    });
    setSaved(true);
  }

  async function handleShare() {
    const allSops = chain.length > 0 ? [...chain, result] : [result];
    let globalNr = 1;
    const text = allSops.map((sop) => {
      let out = `${sop.title || "Arbeitsanweisung"}\n`;
      if (sop.category) out += `Kategorie: ${sop.category}\n`;
      if (sop.total_time_min) out += `Gesamtzeit: ${sop.total_time_min} Min.\n\n`;
      if (sop.steps) {
        sop.steps.forEach((s) => {
          out += `${globalNr++}. ${s.action}`;
          if (s.time_min) out += ` (${s.time_min} Min.)`;
          if (s.tools?.length) out += `\n   Werkzeuge: ${s.tools.join(", ")}`;
          if (s.safety) out += `\n   \u26A0\uFE0F ${s.safety}`;
          out += "\n";
        });
      }
      return out;
    }).join("\n---\n\n");

    if (navigator.share) {
      try { await navigator.share({ title: result?.title || "SOP", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  function addToChain() {
    setChain((prev) => [...prev, result]);
    setPhase("input");
    setInputText("");
    setInputImage(null);
    setResult(null);
    setIteration(1);
    setPreviousResult(null);
    setSaved(false);
    setCheckedSteps({});
    setError(null);
    setShowMeta(false);
  }

  function resetAll() {
    setPhase("input");
    setCategory("montage");
    setInputText("");
    setInputImage(null);
    setResult(null);
    setSopFormat("steps");
    setIteration(1);
    setPreviousResult(null);
    setSaved(false);
    setChain([]);
    setCheckedSteps({});
    setError(null);
    setMeta({ area: "", author: "", machine: "" });
    setShowMeta(false);
  }

  function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  function toggleStep(nr) {
    setCheckedSteps((prev) => ({ ...prev, [nr]: !prev[nr] }));
  }

  function updateMeta(key, value) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="px-4 pt-2 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={phase === "result" && chain.length === 0 ? resetAll : onBack}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-100">SOP Builder</h1>
          <div className="h-0.5 w-12 rounded-full mt-1" style={{ backgroundColor: "#FF6B2C" }} />
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
          {/* Chain indicator */}
          {chain.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
              <p className="text-orange-400 text-sm font-medium">
                SOP-Kette: {chain.length} {chain.length === 1 ? "Abschnitt" : "Abschnitte"} erstellt
              </p>
              <p className="text-zinc-400 text-xs mt-1">Naechsten Arbeitsschritt beschreiben:</p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Kategorie</label>
            <CategorySelector value={category} onChange={setCategory} />
          </div>

          {/* Voice */}
          <VoiceInput onTranscript={handleTranscript} disabled={false} />

          {/* Textarea + Photo */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Beschreibung</label>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  autoResize(e.target);
                }}
                placeholder="Beschreibe den Arbeitsschritt oder nutze das Mikrofon..."
                rows={3}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute right-2 top-2 w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg active:scale-95 transition-transform"
              >
                {"\u{1F4F7}"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                className="hidden"
              />
            </div>
            {inputImage && (
              <div className="relative inline-block mt-2">
                <img
                  src={`data:image/jpeg;base64,${inputImage}`}
                  alt="Foto"
                  className="w-15 h-15 rounded-lg object-cover border border-zinc-700"
                />
                <button
                  onClick={() => setInputImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-xs text-zinc-300"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={() => runAnalysis()}
            disabled={inputText.trim().length < 10}
            className="w-full h-14 rounded-xl font-bold text-base text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#FF6B2C" }}
          >
            SOP erstellen
          </button>
        </div>
      )}

      {/* ── PROCESSING PHASE ── */}
      {phase === "processing" && <LoadingState texts={LOADING_TEXTS} />}

      {/* ── RESULT PHASE ── */}
      {phase === "result" && result && (
        <div ref={resultRef} className="space-y-4">
          {/* SOP Document */}
          <SOPResult
            sop={result}
            chain={chain}
            format={sopFormat}
            onFormatChange={setSopFormat}
            checkedSteps={checkedSteps}
            onToggleStep={toggleStep}
            iteration={iteration}
            meta={meta}
          />

          {/* ─── Details ergänzen ─── */}
          {showMeta && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <button
                onClick={() => setShowMeta(false)}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Details ergaenzen</h3>
                <span className="text-zinc-500 text-xs">optional</span>
              </button>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Bereich/Station</label>
                  <input
                    type="text"
                    value={meta.area}
                    onChange={(e) => updateMeta("area", e.target.value)}
                    placeholder="z.B. Montage Station 3"
                    className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Erstellt von</label>
                  <input
                    type="text"
                    value={meta.author}
                    onChange={(e) => updateMeta("author", e.target.value)}
                    placeholder="Name"
                    className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Bauteil/Maschine</label>
                  <input
                    type="text"
                    value={meta.machine}
                    onChange={(e) => updateMeta("machine", e.target.value)}
                    placeholder="z.B. Radlader L120H"
                    className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Feedback</h3>
            <FeedbackInput onSubmit={handleFeedback} disabled={phase === "processing"} />
          </div>

          {/* Add to chain */}
          <button
            onClick={addToChain}
            className="w-full h-14 rounded-xl font-semibold text-sm text-orange-400 border border-dashed border-orange-500/30 bg-orange-500/5 active:scale-[0.98] transition-transform"
          >
            + Weiteren Abschnitt hinzufuegen
          </button>

          {/* Actions */}
          <ActionButtons onSave={handleSave} onShare={handleShare} saved={saved} />

          {/* New SOP */}
          <button
            onClick={resetAll}
            className="w-full h-14 rounded-xl font-semibold text-sm bg-zinc-900 text-zinc-400 border border-zinc-800 active:scale-[0.98] transition-transform"
          >
            Neue SOP
          </button>
        </div>
      )}
    </div>
  );
}
