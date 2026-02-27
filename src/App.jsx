import { useState, useEffect } from "react";
import Home from "./pages/Home";
import SOPBuilder from "./pages/SOPBuilder";
import FiveSAudit from "./pages/FiveSAudit";
import DataAnalysis from "./pages/DataAnalysis";

function App() {
  const [screen, setScreen] = useState("home");
  const [savedResult, setSavedResult] = useState(null);
  const [transitionClass, setTransitionClass] = useState("page-active");

  function navigateTo(target, result) {
    setTransitionClass("page-exit");
    setTimeout(() => {
      setSavedResult(result || null);
      setScreen(target);
      window.scrollTo(0, 0);
      setTransitionClass("page-enter");
      // Trigger reflow, then animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionClass("page-active");
        });
      });
    }, 150);
  }

  function goHome() {
    navigateTo("home");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom">
      <div className="max-w-md mx-auto py-6">
        <div className={transitionClass}>
          {screen === "home" && <Home onNavigate={navigateTo} />}
          {screen === "sop" && <SOPBuilder onBack={goHome} savedResult={savedResult} />}
          {screen === "fives" && <FiveSAudit onBack={goHome} savedResult={savedResult} />}
          {screen === "data" && <DataAnalysis onBack={goHome} savedResult={savedResult} />}
        </div>
      </div>
    </div>
  );
}

export default App;
