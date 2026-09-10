import { useEffect, useRef, useState, type FormEvent } from "react";
import { getCatalogPage } from "../api/getCatalogPage";
import { CatalogRevisionChangedError } from "../api/CatalogRevisionChangedError";
import { RateLimitError } from "../api/RateLimitError";
import { FrameworkNotFoundError } from "../api/FrameworkNotFoundError";
import { RetryButton } from "./RetryButton";
import { getFrameworkDetails } from "../api/getFrameworkDetails";
import { searchFrameworks } from "../api/searchFrameworks";
import type { FrameworkSummary } from "../types/FrameworkSummary";
import type { Technology } from "../types/Technology";
import type { FrameworkDetails } from "../types/FrameworkDetails";
import type { FrameworkRecommendation } from "../types/FrameworkRecommendation";
import { CatalogCard } from "./CatalogCard";
import { FrameworkDetailsDialog } from "./FrameworkDetailsDialog";
import { BrandMark } from "./BrandMark";
import { SearchValidationError } from "../api/SearchValidationError";

export function DiscoveryPage(): React.JSX.Element {
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [error, setError] = useState<string>();
  const [queryError, setQueryError] = useState<string>();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [technology, setTechnology] = useState<Technology>("All technologies");
  const [details, setDetails] = useState<FrameworkDetails>();
  const [detailId, setDetailId] = useState<string>();
  const [detailSourceRevision, setDetailSourceRevision] = useState<string>();
  const [detailError, setDetailError] = useState<string>();
  const [selectedFramework, setSelectedFramework] = useState<FrameworkSummary>();
  const [unavailableId, setUnavailableId] = useState<string>();
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [selectionCleared, setSelectionCleared] = useState(false);
  const [retry, setRetry] = useState<(() => void)>();
  const [retryAt, setRetryAt] = useState<number>();
  const [detailRetryAt, setDetailRetryAt] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string>();
  const [catalogRevision, setCatalogRevision] = useState<string>();
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogNotice, setCatalogNotice] = useState<string>();
  const [recommendations, setRecommendations] = useState<FrameworkRecommendation[]>();
  const [isIndexIncomplete, setIsIndexIncomplete] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const detailOpener = useRef<HTMLButtonElement | null>(null);
  const discoveryRequest = useRef(0);
  const detailRequest = useRef(0);
  const discoveryController = useRef<AbortController | undefined>(undefined);
  const detailController = useRef<AbortController | undefined>(undefined);
  const detailRecommendation = !isLoading && !error && submittedQuery
    ? recommendations?.find(item => item.id === detailId && item.revision === details?.summary.revision
      && item.supportingCapabilityIds?.length > 0
      && item.supportingCapabilityIds.every(id => details?.capabilities?.some(capability => capability.id === id)))
    : undefined;

  useEffect(() => {
    loadCatalog("All technologies");
    return () => {
      discoveryRequest.current += 1;
      detailRequest.current += 1;
      discoveryController.current?.abort();
      detailController.current?.abort();
    };
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

  function beginDiscoveryRequest(): AbortSignal {
    discoveryController.current?.abort();
    discoveryController.current = new AbortController();
    return discoveryController.current.signal;
  }

  function submitQuery(value: string, selectedTechnology: Technology = technology): void {
    setQueryError(undefined);
    setRetryAt(undefined);
    setCatalogNotice(undefined);
    const query = value.trim();
    setSubmittedQuery(query);
    if (!query) {
      setDraftQuery("");
      loadCatalog(selectedTechnology);
      return;
    }
    const request = ++discoveryRequest.current;
    setIsLoading(true);
    searchFrameworks(query, selectedTechnology, beginDiscoveryRequest()).then((response) => {
      if (request !== discoveryRequest.current) return;
      setFrameworks(response.items);
      setRecommendations(response.items);
      setIsIndexIncomplete(response.isIndexIncomplete);
      setError(undefined);
      setRetry(undefined);
      setIsLoading(false);
    }).catch((cause: unknown) => {
      if (request !== discoveryRequest.current) return;
      const invalidQuery = cause instanceof SearchValidationError;
      setQueryError(invalidQuery ? cause.message : undefined);
      setRetryAt(cause instanceof RateLimitError ? cause.retryAt : undefined);
      setError(invalidQuery ? "Update your project description to search again." : cause instanceof RateLimitError ? cause.message : "Framework search is unavailable. Try again.");
      setRetry(invalidQuery ? undefined : () => () => submitQuery(query, selectedTechnology));
      setIsLoading(false);
    });
  }

  function loadCatalog(value: Technology, catalogUpdated = false): void {
    setQueryError(undefined);
    setRetryAt(undefined);
    const request = ++discoveryRequest.current;
    setIsLoading(true);
    setCatalogNotice(undefined);
    getCatalogPage(value, undefined, undefined, beginDiscoveryRequest()).then((page) => {
      if (request !== discoveryRequest.current) return;
      setFrameworks(page.items);
      setCatalogRevision(page.catalogRevision);
      setCatalogTotal(page.total);
      setRecommendations(undefined);
      setIsIndexIncomplete(false);
      setNextCursor(page.nextCursor ?? undefined);
      setCatalogNotice(catalogUpdated ? "Catalog updated. Showing the latest frameworks." : undefined);
      setError(undefined);
      setRetry(undefined);
      setIsLoading(false);
    }).catch((cause: unknown) => {
      if (request !== discoveryRequest.current) return;
      setError(cause instanceof RateLimitError ? cause.message : "The catalog is unavailable. Try again.");
      setRetryAt(cause instanceof RateLimitError ? cause.retryAt : undefined);
      setRetry(() => () => loadCatalog(value, catalogUpdated));
      setIsLoading(false);
    });
  }

  function loadMore(): void {
    setRetryAt(undefined);
    if (!nextCursor) {
      return;
    }
    const cursor = nextCursor;
    const request = ++discoveryRequest.current;
    setIsLoading(true);
    getCatalogPage(technology, cursor, catalogRevision, beginDiscoveryRequest()).then((page) => {
      if (request !== discoveryRequest.current) return;
      if (page.catalogRevision !== catalogRevision) {
        loadCatalog(technology, true);
        return;
      }
      setFrameworks((items) => [...items, ...page.items]);
      setCatalogTotal(page.total);
      setNextCursor(page.nextCursor ?? undefined);
      setError(undefined);
      setRetry(undefined);
      setIsLoading(false);
    }).catch((cause: unknown) => {
      if (request !== discoveryRequest.current) return;
      if (cause instanceof CatalogRevisionChangedError) {
        loadCatalog(technology, true);
        return;
      }
      setError(cause instanceof RateLimitError ? cause.message : "The catalog is unavailable. Try again.");
      setRetryAt(cause instanceof RateLimitError ? cause.retryAt : undefined);
      setRetry(() => () => loadMore());
      setIsLoading(false);
    });
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

  function openFrameworkDetails(id: string, opener: HTMLButtonElement, sourceRevision = frameworks.find(item => item.id === id)?.revision): void {
    detailOpener.current = opener;
    setDetailSourceRevision(sourceRevision);
    setDetailId(id);
    setDetails(undefined);
    setDetailError(undefined);
    loadFrameworkDetails(id);
  }

  function loadFrameworkDetails(id: string): void {
    setDetailRetryAt(undefined);
    const request = ++detailRequest.current;
    detailController.current?.abort();
    detailController.current = new AbortController();
    setDetailError(undefined);
    setDetailUnavailable(false);
    getFrameworkDetails(id, detailController.current.signal).then((result) => {
      if (request !== detailRequest.current) return;
      setDetails(result);
      setSelectedFramework(current => current?.id === id ? result.summary : current);
      setUnavailableId(current => current === id ? undefined : current);
    }).catch((cause: unknown) => {
      if (request !== detailRequest.current) return;
      const missing = cause instanceof FrameworkNotFoundError;
      setDetailUnavailable(missing);
      if (missing) setUnavailableId(id);
      setDetailRetryAt(cause instanceof RateLimitError ? cause.retryAt : undefined);
      setDetailError(cause instanceof RateLimitError || missing ? (cause as Error).message : "Framework details are unavailable. Try again.");
    });
  }

  function closeFrameworkDetails(): void {
    detailRequest.current += 1;
    detailController.current?.abort();
    setDetailId(undefined);
    setDetails(undefined);
    setDetailError(undefined);
    requestAnimationFrame(() => (detailOpener.current?.isConnected ? detailOpener.current : resultsHeading.current)?.focus({ preventScroll: true }));
  }

  function selectFramework(): void {
    if (details) {
      setSelectedFramework(details.summary);
      setSelectionCleared(false);
      setUnavailableId(undefined);
    }
  }

  function clearSelection(): void {
    const id = selectedFramework?.id;
    setSelectedFramework(undefined);
    setUnavailableId(undefined);
    setSelectionCleared(true);
    requestAnimationFrame(() => (document.getElementById(`framework-details-${id}`) ?? resultsHeading.current)?.focus({ preventScroll: true }));
  }

  return <>
    <a className="skip-link" href="#framework-results" onClick={() => resultsHeading.current?.focus()}>Skip to frameworks</a>
    <header className="site-header">
      <div className="brand"><BrandMark />quarry<span>.</span></div>
      <p className="header-caption">A foundation for what comes next.</p>
      <span className="header-note">UI framework discovery</span>
    </header>
    <main>
    <section className="search-section" aria-label="Find your framework">
    <p className="eyebrow">GOOD IDEAS START WITH THE RIGHT TOOLS</p>
    <h1>{submittedQuery ? `Frameworks for ${submittedQuery}` : "Describe your project"}</h1>
    <p className="search-intro">Discover a framework that fits what you want to build.<br />Explore its capabilities, try its components, and make it yours.</p>
    <form className="project-search" onSubmit={submit}>
      <label htmlFor="project-description">What are you building?</label>
      <div className="search-row">
        <input ref={searchInput} id="project-description" name="project-description" placeholder="A place for your next idea…" maxLength={500} value={draftQuery} aria-invalid={queryError ? true : undefined} aria-describedby={queryError ? "project-error" : undefined} onChange={(event) => setDraftQuery(event.target.value)} />
        <button className="primary-button" type="submit">Find frameworks <span aria-hidden="true">↗</span></button>
      </div>
      {queryError && <p className="field-error" id="project-error" role="alert">{queryError}</p>}
      {submittedQuery && <button className="clear-search" type="button" onClick={clearSearch}>Clear search</button>}
    </form>
    <section className="examples" aria-label="Project examples"><p>Try an example:</p>
      {["Animal Hospital", "Online store", "Analytics dashboard"].map((example) => <button key={example} type="button" onClick={() => { setDraftQuery(example); submitQuery(example); }}>{example}</button>)}
    </section>
    <p className="search-help">Your project, your starting point. <kbd>Ctrl / ⌘ + K</kbd> to focus search.</p>
    </section>
    <div className="results-heading">
      <div><p className="eyebrow">EXPLORE THE POSSIBILITIES</p><h2 id="framework-results" ref={resultsHeading} tabIndex={-1}>Framework results</h2>
        {!submittedQuery && !isLoading && !error && <p aria-live="polite" aria-atomic="true">Showing {frameworks.length} of {catalogTotal} frameworks</p>}
        {recommendations && !isLoading && !error && <p aria-live={isIndexIncomplete ? "off" : "polite"} aria-atomic="true">{recommendations.length} {recommendations.length === 1 ? "recommendation" : "recommendations"} ordered by relevance</p>}
      </div>
      <div className="technology-filter"><label htmlFor="technology">Technology</label>
        <select id="technology" value={technology} onChange={(event) => changeTechnology(event.target.value as Technology)}>
          {["All technologies", "React", "Angular", "Vue", "Web Components"].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
    </div>
    {catalogNotice && <p className="catalog-notice" role="status">{catalogNotice}</p>}
    {selectionCleared && <p role="status">No framework selected.</p>}
    <section className="framework-grid" aria-label="Framework catalog" aria-busy={isLoading}>
      {isLoading ? <p role="status">Loading frameworks</p> : error ? <section><p role={queryError ? undefined : "alert"}>{error}</p>{retry && <RetryButton retryAt={retryAt} onRetry={retry} />}
        {submittedQuery && <button type="button" onClick={browseAllFrameworks}>Browse all frameworks</button>}
      </section> : <>
        {isIndexIncomplete && <section><p role="status">Results are temporarily incomplete while framework indexing finishes.</p>
          <button type="button" onClick={() => submitQuery(submittedQuery, technology)}>Retry</button><button type="button" onClick={browseAllFrameworks}>Browse all frameworks</button>
        </section>}
        {!submittedQuery && frameworks.length === 0 ? <p>No frameworks are available.</p> : submittedQuery && frameworks.length === 0 && !isIndexIncomplete ? <section>
          <h2>No matching frameworks</h2><p>Try revising your project description or changing technology.</p><button type="button" onClick={browseAllFrameworks}>Browse all frameworks</button>
        </section> : <>
          {frameworks.map((framework) => <CatalogCard framework={framework} recommendation={recommendations?.find((item) => item.id === framework.id)} isSelected={selectedFramework?.id === framework.id} onExplore={openFrameworkDetails} key={framework.id} />)}
          {!submittedQuery && nextCursor && <button type="button" onClick={loadMore}>Load more</button>}
        </>}
      </>}
    </section>
    <footer className="site-footer"><span><BrandMark />Built on possibilities.</span><span>Discover. Explore. Make it yours.</span></footer>
    {selectedFramework && <aside className="selection-bar" role="status" aria-label="Selected framework">
      <div><span className="eyebrow">YOUR FRAMEWORK</span><strong>{selectedFramework.name} selected</strong><span>{selectedFramework.technology}</span></div>
      {unavailableId === selectedFramework.id && <p>Unavailable — clear this selection or select another framework.</p>}
      <button type="button" onClick={(event) => openFrameworkDetails(selectedFramework.id, event.currentTarget, selectedFramework.revision)}>Review selection</button>
      <button type="button" onClick={clearSelection}>Clear selected framework</button>
    </aside>}
    {detailId && <FrameworkDetailsDialog details={details} error={detailError} retryAt={detailRetryAt} isLoading={!details && !detailError}
      isSelected={selectedFramework?.id === detailId} isUnavailable={detailUnavailable}
      isUpdated={!!details && !!detailSourceRevision && detailSourceRevision !== details.summary.revision} explanation={detailRecommendation?.explanation}
      onClose={closeFrameworkDetails} onRetry={() => loadFrameworkDetails(detailId)} onSelect={selectFramework} />}
  </main></>;
}
