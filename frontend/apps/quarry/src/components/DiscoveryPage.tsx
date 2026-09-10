import { useEffect, useState } from "react";
import { getCatalogPage } from "../api/getCatalogPage";
import type { FrameworkSummary } from "../types/FrameworkSummary";
import { CatalogCard } from "./CatalogCard";

export function DiscoveryPage(): React.JSX.Element {
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getCatalogPage().then((page) => setFrameworks(page.items)).catch(() => setError("The catalog is unavailable. Try again."));
  }, []);

  return <main><h1>Describe your project</h1><form><label htmlFor="project-description">What are you building?</label><input id="project-description" name="project-description" /><button type="submit">Find frameworks</button></form><section aria-label="Framework catalog" aria-live="polite">{error ? <p role="alert">{error}</p> : frameworks.map((framework) => <CatalogCard framework={framework} key={framework.id} />)}</section></main>;
}
