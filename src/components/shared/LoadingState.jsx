import { useState, useEffect } from "react";

export default function LoadingState({ texts = ["Wird geladen..."] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (texts.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90">
      {/* Pulsing ring */}
      <div className="w-[120px] h-[120px] rounded-full border-4 border-blue-400/30 flex items-center justify-center mb-8">
        <div className="w-[90px] h-[90px] rounded-full border-4 border-blue-400/60 animate-pulse flex items-center justify-center">
          <div className="w-[60px] h-[60px] rounded-full bg-blue-400/20 animate-pulse" />
        </div>
      </div>

      {/* Rotating text */}
      <p className="text-zinc-300 text-base font-medium transition-opacity duration-300">
        {texts[index]}
      </p>
    </div>
  );
}
