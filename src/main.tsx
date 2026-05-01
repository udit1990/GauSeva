import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Telemetry: mark app bootstrap start
performance.mark("app-boot");

const dismiss = () => {
  const splash = document.getElementById("splash");
  if (splash) {
    splash.style.opacity = "0";
    splash.addEventListener("transitionend", () => splash.remove());
  }

  // Measure time-to-home-render
  try {
    performance.mark("home-ready");
    const measure = performance.measure("time-to-home", "app-boot", "home-ready");
    const ms = Math.round(measure.duration);
    console.info(`[perf] time-to-home: ${ms}ms`);
    // Stash for optional analytics pickup
    (window as any).__perfTimeToHome = ms;
  } catch {
    // Already measured or marks missing — ignore
  }
};

// App calls this when truly ready (after auth resolves)
(window as any).__dismissSplash = dismiss;

// Safety net: always dismiss after 4s even if something fails
setTimeout(dismiss, 4000);

createRoot(document.getElementById("root")!).render(<App />);
