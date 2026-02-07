import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Remove splash screen after React mounts
const splash = document.getElementById('splash-screen');
if (splash) {
  // Ensure animation is visible for at least 1.5s
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 500);
  }, 1500);
}
