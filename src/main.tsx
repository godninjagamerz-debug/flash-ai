import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { runMigration } from "./lib/migrate";
import { revokeStoredPromotions } from "./services/promoService";

// Run localStorage migration before first render — safe, never destructive
runMigration();
revokeStoredPromotions();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>
);
