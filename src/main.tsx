import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "@/lib/logger";
import { initForensicTracer } from "@/utils/forensicTracer";
import { runTransportDiagnostic } from "@/utils/transportDiagnostic";
import { initializeProcessForensics, forensicLog } from "@/utils/processForensics";

console.log("[BOOT_SEQUENCE_STEP] 1. Importing modules complete");

// 🕵️ CRITICAL: Start tracing before ANY module load
initForensicTracer();

console.log("[BOOT_SEQUENCE_STEP] 2. Forensic tracer initialized");

// [PROCESS_FORENSICS] Initialize hard native/renderer tracking
initializeProcessForensics();

console.log("[BOOT_SEQUENCE_STEP] 3. Process forensics initialized");

// 🧪 TRANSPORT_DIAGNOSTIC: Test networking layer on startup
if (import.meta.env.DEV) {
    runTransportDiagnostic();
}

console.log("[BOOT_SEQUENCE_STEP] 4. Setting up global error listeners");

window.addEventListener("error", (event) => {
  logger.error("Unhandled window error", event.error ?? event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection", event.reason);
});

console.log("[BOOT_SEQUENCE_STEP] 5. Rendering root App component");
createRoot(document.getElementById("root")!).render(<App />);
