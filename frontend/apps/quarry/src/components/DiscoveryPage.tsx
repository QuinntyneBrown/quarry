import { useEffect, useRef, useState, type FormEvent } from "react";
import { getCatalogPage } from "../api/getCatalogPage";
import { getFrameworkDetails } from "../api/getFrameworkDetails";
import { searchFrameworks } from "../api/searchFrameworks";
import type { FrameworkSummary } from "../types/FrameworkSummary";
import type { Technology } from "../types/Technology";
import type { FrameworkDetails } from "../types/FrameworkDetails";
import { CatalogCard } from "./CatalogCard";
import { FrameworkDetailsDialog } from "./FrameworkDetailsDialog";

export function DiscoveryPage(): React.JSX.Element {
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [error, setError] = useState<string>();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [technology, setTechnology] = useState<Technology>("All technologies");
  const [details, setDetails] = useState<FrameworkDetails>();
  const [selectedFramework, setSelectedFramework] = useState<FrameworkSummary>();
  const searchInput = useRef<HTMLInputElement>(null);
  const detailOpener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    getCatalogPage().then((page) => setFrameworks(page.items)).catch(() => setError("The catalog is unavailable. Try again."));
  }, []);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function submitQuery(value: string): void {
    const query = value.trim();
    setSubmittedQuery(query);
    if (!query) {
      return;
    }
    searchFrameworks(query).then((response) => setFrameworks(response.items)).catch(() => setError("Framework search is unavailable. Try again."));
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submitQuery(draftQuery);
  }

  function clearSearch(): void {
    setDraftQuery("");
    setSubmittedQuery("");
    setError(undefined);
    searchInput.current?.focus();
    getCatalogPage(technology).then((page) => setFrameworks(page.items)).catch(() => setError("The catalog is unavailable. Try again."));
  }

  function changeTechnology(value: Technology): void {
    setTechnology(value);
    if (!submittedQuery) {
      getCatalogPage(value).then((page) => setFrameworks(page.items)).catch(() => setError("The catalog is unavailable. Try again."));
    }
  }

  function browseAllFrameworks(): void {
    setDraftQuery("");
    setSubmittedQuery("");
    setTechnology("All technologies");
    setError(undefined);
    getCatalogPage().then((page) => setFrameworks(page.items)).catch(() => setError("The catalog is unavailable. Try again."));
  }

  function openFrameworkDetails(id: string, opener: HTMLButtonElement): void {
    detailOpener.current = opener;
    getFrameworkDetails(id).then(setDetails).catch(() => setError("Framework details are unavailable. Try again."));
  }

  function closeFrameworkDetails(): void {
    setDetails(undefined);
    requestAnimationFrame(() => detailOpener.current?.focus());
  }

  function selectFramework(): void {
    if (details) {
      setSelectedFramework(details.summary);
      closeFrameworkDetails();
    }
  }

  return <main><h1>{submittedQuery ? `Frameworks for ${submittedQuery}` : "Describe your project"}</h1><form onSubmit={submit}><label htmlFor="project-description">What are you building?</label><input ref={searchInput} id="project-description" name="project-description" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} /><button type="submit">Find frameworks</button>{submittedQuery && <button type="button" onClick={clearSearch}>Clear search</button>}</form><label htmlFor="technology">Technology</label><select id="technology" value={technology} onChange={(event) => changeTechnology(event.target.value as Technology)}>{["All technologies", "React", "Angular", "Vue", "Web Components"].map((value) => <option key={value} value={value}>{value}</option>)}</select><section aria-label="Project examples"><p>Try an example:</p>{["Animal Hospital", "Online store", "Analytics dashboard"].map((example) => <button key={example} type="button" onClick={() => { setDraftQuery(example); submitQuery(example); }}>{example}</button>)}</section>{selectedFramework && <aside role="status">{selectedFramework.name} selected <button type="button" onClick={() => setSelectedFramework(undefined)}>Clear selection</button></aside>}<section aria-label="Framework catalog" aria-live="polite">{error ? <p role="alert">{error}</p> : submittedQuery && frameworks.length === 0 ? <section><h2>No matching frameworks</h2><p>Try revising your project description or changing technology.</p><button type="button" onClick={browseAllFrameworks}>Browse all frameworks</button></section> : frameworks.map((framework) => <CatalogCard framework={framework} onExplore={openFrameworkDetails} key={framework.id} />)}</section>{details && <FrameworkDetailsDialog details={details} onClose={closeFrameworkDetails} onSelect={selectFramework} />}</main>;
}
