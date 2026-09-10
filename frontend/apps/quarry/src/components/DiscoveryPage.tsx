import { useEffect, useState, type FormEvent } from "react";
import { getCatalogPage } from "../api/getCatalogPage";
import { searchFrameworks } from "../api/searchFrameworks";
import type { FrameworkSummary } from "../types/FrameworkSummary";
import { CatalogCard } from "./CatalogCard";

export function DiscoveryPage(): React.JSX.Element {
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [error, setError] = useState<string>();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  useEffect(() => {
    getCatalogPage().then((page) => setFrameworks(page.items)).catch(() => setError("The catalog is unavailable. Try again."));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const query = draftQuery.trim();
    setSubmittedQuery(query);
    if (!query) {
      return;
    }
    searchFrameworks(query).then((response) => setFrameworks(response.items)).catch(() => setError("Framework search is unavailable. Try again."));
  }

  return <main><h1>{submittedQuery ? `Frameworks for ${submittedQuery}` : "Describe your project"}</h1><form onSubmit={submit}><label htmlFor="project-description">What are you building?</label><input id="project-description" name="project-description" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} /><button type="submit">Find frameworks</button></form><section aria-label="Framework catalog" aria-live="polite">{error ? <p role="alert">{error}</p> : frameworks.map((framework) => <CatalogCard framework={framework} key={framework.id} />)}</section></main>;
}
