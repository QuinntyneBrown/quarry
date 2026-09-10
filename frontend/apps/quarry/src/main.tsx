import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DiscoveryPage } from "./components/DiscoveryPage";

createRoot(document.getElementById("root")!).render(<StrictMode><DiscoveryPage /></StrictMode>);
