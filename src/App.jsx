import { useState } from "react";
import Home from "./pages/Home";
import SOPBuilder from "./pages/SOPBuilder";
import FiveSAudit from "./pages/FiveSAudit";
import DataAnalysis from "./pages/DataAnalysis";

function App() {
  const [screen, setScreen] = useState("home");
  const [fade, setFade] = useState(true);

  function navigateTo(target) {
    setFade(false);
    setTimeout(() => {
      setScreen(target);
      setFade(true);
    }, 150);
  }

  function goHome() {
    navigateTo("home");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom">
      <div className="max-w-md mx-auto py-6">
        <div
          className={`transition-opacity duration-150 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {screen === "home" && <Home onNavigate={navigateTo} />}
          {screen === "sop" && <SOPBuilder onBack={goHome} />}
          {screen === "fives" && <FiveSAudit onBack={goHome} />}
          {screen === "data" && <DataAnalysis onBack={goHome} />}
        </div>
      </div>
    </div>
  );
}

export default App;
