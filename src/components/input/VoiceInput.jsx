import { useState, useRef, useCallback, useEffect } from "react";

export default function VoiceInput({ onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interimText, setInterimText] = useState("");

  const recognition = useRef(null);
  const finalTextRef = useRef("");
  const stoppingRef = useRef(false);

  // Initialize once on mount
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const rec = new SR();
    rec.lang = "de-DE";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          // Only append genuinely new final results
          // Build full final text from all final results to avoid duplication
          let allFinal = "";
          for (let j = 0; j <= i; j++) {
            if (e.results[j].isFinal) {
              allFinal += e.results[j][0].transcript + " ";
            }
          }
          finalTextRef.current = allFinal;
        } else {
          interim = transcript;
        }
      }
      setInterimText(interim);
      // Always report current state: all finals + current interim
      const combined = (finalTextRef.current + interim).trim();
      if (combined) {
        onTranscript(combined, false);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      setInterimText("");
      // Deliver final text
      const final = finalTextRef.current.trim();
      if (final) {
        onTranscript(final, true);
      }
      // Do NOT restart — user controls start/stop
    };

    rec.onerror = (e) => {
      // "aborted" is expected when user stops manually
      if (e.error !== "aborted") {
        console.warn("[VoiceInput] error:", e.error);
      }
      setIsRecording(false);
      setInterimText("");
    };

    recognition.current = rec;

    return () => {
      rec.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (!recognition.current || disabled) return;
    finalTextRef.current = "";
    stoppingRef.current = false;
    setInterimText("");
    try {
      recognition.current.start();
      setIsRecording(true);
    } catch {
      // Already started — ignore
    }
  }, [disabled]);

  const stop = useCallback(() => {
    if (!recognition.current || stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      recognition.current.stop();
    } catch {
      // Already stopped — ignore
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  }, [isRecording, start, stop]);

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-[72px] h-[72px] rounded-full bg-zinc-800 flex items-center justify-center opacity-50">
          <MicIcon />
        </div>
        <p className="text-zinc-500 text-xs">Spracheingabe nicht verfügbar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        {isRecording && (
          <>
            <span className="absolute w-[88px] h-[88px] rounded-full bg-orange-500/20 animate-ping" />
            <span className="absolute w-[96px] h-[96px] rounded-full border-2 border-orange-500/30 animate-pulse" />
          </>
        )}
        <button
          onClick={toggle}
          disabled={disabled}
          className="relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
          style={{ backgroundColor: isRecording ? "#EF4444" : "#FF6B2C" }}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
      <p className="text-zinc-400 text-sm">
        {isRecording
          ? "Aufnahme l\u00E4uft \u2013 tippen zum Stoppen"
          : "Tippen zum Aufnehmen"}
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
