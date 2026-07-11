import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import i18n, { getCurrentLanguage } from "./i18n";
import { setLocaleGetter } from "@workspace/api-client-react";

// Send the active UI language to the API server on every request so it can
// localize error messages and verification emails.
setLocaleGetter(() => getCurrentLanguage());
void i18n;

createRoot(document.getElementById("root")!).render(<App />);
