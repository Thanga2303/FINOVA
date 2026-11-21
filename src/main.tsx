import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App";
import { applyTheme, getState, markActive } from "./lib/store";
import "./index.css";

applyTheme(getState().theme);
markActive();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* reducedMotion="user": Framer Motion skips transform/scale animations when the OS asks for reduced motion. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
