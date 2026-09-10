import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DiscoveryPage } from "./components/DiscoveryPage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode><DiscoveryPage /></StrictMode>);
