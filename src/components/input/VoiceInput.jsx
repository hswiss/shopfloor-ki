import { useState, useRef, useEffect } from "react";

const SpeechRecognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

const SILENCE_TIMEOUT = 8000;
const WARNING_AT = 5000;

export default function VoiceInput({ onTranscript, disabled }) {
  const [recording, setRecording] = useState(false);
  const [supported] = useState(!!SpeechRecognition);
  const [warning, setWarning] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const warningTimer = useRef(null);
  const hasReceivedResult = useRef(false);

  function resetSilenceTimer() {
    clearTimeout(silenceTimer.current);
    clearTimeout(warningTimer.current);
    setWarning(false);

    warningTimer.current = setTimeout(() => {
      setWarning(true);
    }, WARNING_AT);

    silenceTimer.current = setTimeout(() => {
      stopRecording();
    }, SILENCE_TIMEOUT);
  }

  function clearTimers() {
    clearTimeout(silenceTimer.current);
    clearTimeout(warningTimer.current);
    setWarning(false);
    hasReceivedResult.current = false;
  }

  function startRecording() {
    if (!SpeechRecognition || disabled) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (e) => {
      // Start silence timer only after first result arrives
      if (!hasReceivedResult.current) {
        hasReceivedResult.current = true;
      }
      resetSilenceTimer();

      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim = t;
        }
      }
      onTranscript(finalTranscript + interim, false);
    };

    recognition.onend = () => {
      setRecording(false);
      clearTimers();
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim(), true);
      }
    };

    recognition.onerror = () => {
      setRecording(false);
      clearTimers();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    // No silence timer here — timer starts only after first result
  }

  function stopRecording() {
    clearTimers();
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function toggle() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  useEffect(() => {
    return () => {
      clearTimeout(silenceTimer.current);
      clearTimeout(warningTimer.current);
      recognitionRef.current?.stop();
    };
  }, []);

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
        {recording && (
          <>
            <span className="absolute w-[88px] h-[88px] rounded-full bg-orange-500/20 animate-ping" />
            <span className="absolute w-[96px] h-[96px] rounded-full border-2 border-orange-500/30 animate-pulse" />
          </>
        )}
        <button
          onClick={toggle}
          disabled={disabled}
          className="relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
          style={{ backgroundColor: recording ? "#EF4444" : "#FF6B2C" }}
        >
          {recording ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
      <p className="text-zinc-400 text-sm">
        {recording
          ? warning
            ? "Aufnahme endet in 3s..."
            : "Aufnahme läuft \u2013 nochmal tippen zum Stoppen"
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
