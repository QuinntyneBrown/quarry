import { useEffect, useRef, useState, type FormEvent } from "react";
import { getCatalogPage } from "../api/getCatalogPage";
import { getFrameworkDetails } from "../api/getFrameworkDetails";
import { searchFrameworks } from "../api/searchFrameworks";
import type { FrameworkSummary } from "../types/FrameworkSummary";
import type { Technology } from "../types/Technology";
import type { FrameworkDetails } from "../types/FrameworkDetails";
import type { FrameworkRecommendation } from "../types/FrameworkRecommendation";
import { CatalogCard } from "./CatalogCard";
import { FrameworkDetailsDialog } from "./FrameworkDetailsDialog";

export function DiscoveryPage(): React.JSX.Element {
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [error, setError] = useState<string>();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [technology, setTechnology] = useState<Technology>("All technologies");
  const [details, setDetails] = useState<FrameworkDetails>();
  const [detailId, setDetailId] = useState<string>();
  const [detailError, setDetailError] = useState<string>();
  const [selectedFramework, setSelectedFramework] = useState<FrameworkSummary>();
  const [retry, setRetry] = useState<(() => void)>();
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string>();
  const [recommendations, setRecommendations] = useState<FrameworkRecommendation[]>();
  const [isIndexIncomplete, setIsIndexIncomplete] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const detailOpener = useRef<HTMLButtonElement | null>(null);
  const discoveryRequest = useRef(0);
  const detailRequest = useRef(0);

  useEffect(() => {
    loadCatalog("All technologies");
  }, []);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent): void {
      if (!detailId && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [detailId]);

  function submitQuery(value: string, selectedTechnology: Technology = technology): void {
    const query = value.trim();
    setSubmittedQuery(query);
    if (!query) {
      setDraftQuery("");
      loadCatalog(selectedTechnology);
      return;
    }
    const request = ++discoveryRequest.current;
    setIsLoading(true);
    searchFrameworks(query, selectedTechnology).then((response) => { if (request === discoveryRequest.current) { setFrameworks(response.items); setRecommendations(response.items); setIsIndexIncomplete(response.isIndexIncomplete); setError(undefined); setRetry(undefined); setIsLoading(false); } }).catch(() => { if (request === discoveryRequest.current) { setError("Framework search is unavailable. Try again."); setRetry(() => () => submitQuery(query, selectedTechnology)); setIsLoading(false); } });
  }

  function loadCatalog(value: Technology): void {
    const request = ++discoveryRequest.current;
    setIsLoading(true);
    getCatalogPage(value).then((page) => { if (request === discoveryRequest.current) { setFrameworks(page.items); setRecommendations(undefined); setIsIndexIncomplete(false); setNextCursor(page.nextCursor ?? undefined); setError(undefined); setRetry(undefined); setIsLoading(false); } }).catch(() => { if (request === discoveryRequest.current) { setError("The catalog is unavailable. Try again."); setRetry(() => () => loadCatalog(value)); setIsLoading(false); } });
  }

  function loadMore(): void {
    if (!nextCursor) {
      return;
    }
    const cursor = nextCursor;
    const request = ++discoveryRequest.current;
    setIsLoading(true);
    getCatalogPage(technology, cursor).then((page) => { if (request === discoveryRequest.current) { setFrameworks((items) => [...items, ...page.items]); setNextCursor(page.nextCursor ?? undefined); setError(undefined); setRetry(undefined); setIsLoading(false); } }).catch(() => { if (request === discoveryRequest.current) { setError("The catalog is unavailable. Try again."); setRetry(() => () => loadMore()); setIsLoading(false); } });
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
    loadCatalog(technology);
  }

  function changeTechnology(value: Technology): void {
    setTechnology(value);
    if (!submittedQuery) {
      loadCatalog(value);
      return;
    }
    submitQuery(submittedQuery, value);
  }

  function browseAllFrameworks(): void {
    setDraftQuery("");
    setSubmittedQuery("");
    setTechnology("All technologies");
    setError(undefined);
    loadCatalog("All technologies");
  }

  function openFrameworkDetails(id: string, opener: HTMLButtonElement): void {
    detailOpener.current = opener;
    setDetailId(id);
    setDetails(undefined);
    setDetailError(undefined);
    loadFrameworkDetails(id);
  }

  function loadFrameworkDetails(id: string): void {
    const request = ++detailRequest.current;
    setDetailError(undefined);
    getFrameworkDetails(id).then((result) => { if (request === detailRequest.current) { setDetails(result); } }).catch(() => { if (request === detailRequest.current) { setDetailError("Framework details are unavailable. Try again."); } });
  }

  function closeFrameworkDetails(): void {
    detailRequest.current += 1;
    setDetailId(undefined);
    setDetails(undefined);
    setDetailError(undefined);
    requestAnimationFrame(() => detailOpener.current?.focus());
  }

  function selectFramework(): void {
    if (details) {
      setSelectedFramework(details.summary);
      closeFrameworkDetails();
    }
  }

  return <main><h1>{submittedQuery ? `Frameworks for ${submittedQuery}` : "Describe your project"}</h1><form onSubmit={submit}><label htmlFor="project-description">What are you building?</label><input ref={searchInput} id="project-description" name="project-description" maxLength={500} value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} /><button type="submit">Find frameworks</button>{submittedQuery && <button type="button" onClick={clearSearch}>Clear search</button>}</form><label htmlFor="technology">Technology</label><select id="technology" value={technology} onChange={(event) => changeTechnology(event.target.value as Technology)}>{["All technologies", "React", "Angular", "Vue", "Web Components"].map((value) => <option key={value} value={value}>{value}</option>)}</select><section aria-label="Project examples"><p>Try an example:</p>{["Animal Hospital", "Online store", "Analytics dashboard"].map((example) => <button key={example} type="button" onClick={() => { setDraftQuery(example); submitQuery(example); }}>{example}</button>)}</section>{selectedFramework && <aside role="status">{selectedFramework.name} selected <button type="button" onClick={(event) => openFrameworkDetails(selectedFramework.id, event.currentTarget)}>Review selection</button><button type="button" onClick={() => setSelectedFramework(undefined)}>Clear selection</button></aside>}{recommendations && <p>{recommendations.length} {recommendations.length === 1 ? "recommendation" : "recommendations"} ordered by relevance</p>}<section aria-label="Framework catalog" aria-live="polite">{isLoading ? <p role="status">Loading frameworks</p> : error ? <section><p role="alert">{error}</p>{retry && <button type="button" onClick={retry}>Retry</button>}</section> : <>{isIndexIncomplete && <section><p role="status">Results are temporarily incomplete while framework indexing finishes.</p><button type="button" onClick={() => submitQuery(submittedQuery, technology)}>Retry</button><button type="button" onClick={browseAllFrameworks}>Browse all frameworks</button></section>}{submittedQuery && frameworks.length === 0 && !isIndexIncomplete ? <section><h2>No matching frameworks</h2><p>Try revising your project description or changing technology.</p><button type="button" onClick={browseAllFrameworks}>Browse all frameworks</button></section> : <>{frameworks.map((framework) => <CatalogCard framework={framework} recommendation={recommendations?.find((item) => item.id === framework.id)} isSelected={selectedFramework?.id === framework.id} onExplore={openFrameworkDetails} key={framework.id} />)}{!submittedQuery && nextCursor && <button type="button" onClick={loadMore}>Load more</button>}</>}</>}</section>{detailId && <FrameworkDetailsDialog details={details} error={detailError} isLoading={!details && !detailError} onClose={closeFrameworkDetails} onRetry={() => loadFrameworkDetails(detailId)} onSelect={selectFramework} />}</main>;
}
