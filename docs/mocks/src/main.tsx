import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Command,
  Layers3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { Framework } from "./catalog";
import { recommend } from "./recommendations";
import "./styles.css";

function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="tags" aria-label="Framework tags">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}
function Detail({
  framework: f,
  reason,
  selected,
  onSelect,
  onClose,
}: {
  framework: Framework;
  reason: string;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("Overview");
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState("Jamie");
  const [feedback, setFeedback] = useState("");
  const tabs = ["Overview", "Components"];
  useEffect(() => {
    dialog.current?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="detail-dialog"
      aria-labelledby="detail-title"
      onCancel={onClose}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom)
        ) onClose();
      }}
    >
      <div className="detail-header">
        <span className="eyebrow">FRAMEWORK DETAILS</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close framework details"
        >
          <X size={20} />
        </button>
      </div>
      <div className="detail-intro">
        <div className="detail-title-row">
          <span className="framework-icon">
            <Layers3 size={24} />
          </span>
          <div>
            <h2 id="detail-title">{f.name}</h2>
            <span className="detail-metadata">
              {f.type} <span>·</span> {f.components} components
            </span>
          </div>
        </div>
        <p>{f.description}</p>
        <Tags tags={f.tags} />
      </div>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label="Framework details"
      >
        {tabs.map((item, index) => (
          <button
            key={item}
            id={`detail-tab-${index}`}
            role="tab"
            aria-selected={tab === item}
            aria-controls="detail-panel"
            tabIndex={tab === item ? 0 : -1}
            onClick={() => setTab(item)}
            onKeyDown={(event) => {
              if (
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 1
                      : 1 - index;
                setTab(tabs[next]);
                document.getElementById(`detail-tab-${next}`)?.focus();
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div
        className="detail-panel"
        id="detail-panel"
        role="tabpanel"
        aria-labelledby={`detail-tab-${tabs.indexOf(tab)}`}
        tabIndex={0}
      >
        {tab === "Overview" ? (
          <>
            {reason && (
              <div className="detail-reason">
                <Sparkles size={17} />
                <div>
                  <h3>Why it fits your project</h3>
                  <p>{reason}</p>
                </div>
              </div>
            )}
            <h3>What you can build with</h3>
            <ul className="capabilities">
              {f.capabilities.map((item) => (
                <li key={item}>
                  <Check size={15} />
                  {item}
                </li>
              ))}
            </ul>
            <h3>Useful for</h3>
            <p className="use-cases">{f.useCases.join(" · ")}</p>
          </>
        ) : (
          <>
            <div className="panel-heading">
              <h3>Try the components</h3>
              <p>Illustrative controls shared by this mock, not released framework components.</p>
            </div>
            <div className="playground">
              <div className="sample-heading">
                <span>
                  <Layers3 size={16} /> {f.name} workspace
                </span>
                <span className="sample-badge">Illustrative sample</span>
              </div>
              <div className="sample-body">
                <label htmlFor="display-name">Display name</label>
                <input
                  id="display-name"
                  value={name}
                  maxLength={60}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
                <div className="switch-row">
                  <div>
                    <strong>Email notifications</strong>
                    <small>
                      {enabled
                        ? "Receive updates about your activity."
                        : "Notifications are paused."}
                    </small>
                  </div>
                  <button
                    className={`switch ${enabled ? "on" : ""}`}
                    role="switch"
                    aria-checked={enabled}
                    aria-label="Email notifications"
                    onClick={() => setEnabled(!enabled)}
                  >
                    <span />
                  </button>
                </div>
                <div className="button-row">
                  <button
                    className="primary-button"
                    onClick={() =>
                      setFeedback(
                        `Saved for ${name.trim() || "you"} in this preview.`,
                      )
                    }
                  >
                    Save changes <ArrowRight size={15} />
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setName("Jamie");
                      setEnabled(true);
                      setFeedback("Preview reset.");
                    }}
                  >
                    Reset
                  </button>
                </div>
                <p className="playground-feedback" role="status">
                  {feedback || "Changes stay in this preview."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="theme-note">
        <Layers3 size={17} />
        <p>
          <strong>Your colors. Your brand.</strong> Every framework can be
          themed and skinned during implementation.
        </p>
      </div>
      <div className="detail-footer">
        <span>Select the framework for its capabilities.</span>
        <button
          className={`primary-button ${selected ? "is-selected" : ""}`}
          onClick={onSelect}
        >
          {selected ? (
            <>
              <Check size={17} /> Selected
            </>
          ) : (
            <>
              Select {f.name} <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {selected ? `${f.name} selected as your framework.` : ""}
      </p>
    </dialog>
  );
}

function App() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("All technologies");
  const [active, setActive] = useState<{
    framework: Framework;
    reason: string;
  } | null>(null);
  const [selected, setSelected] = useState<Framework | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const recommendations = recommend(query, technology);
  const isSearching = query.trim().length > 0;
  function submit(event: FormEvent) {
    event.preventDefault();
    setQuery(draft.trim());
  }
  function searchExample(value: string) {
    setDraft(value);
    setQuery(value);
  }
  function reset() {
    setDraft("");
    setQuery("");
    setTechnology("All technologies");
    search.current?.focus();
  }
  function openDetail(
    framework: Framework,
    button: HTMLButtonElement,
    reason = "",
  ) {
    opener.current = button;
    setActive({ framework, reason });
  }
  function closeDetail() {
    setActive(null);
    requestAnimationFrame(() => {
      const target = opener.current?.isConnected
        ? opener.current
        : document.getElementById("catalog-title");
      target?.focus({ preventScroll: true });
    });
  }
  function clearSelection() {
    const selectedId = selected?.id;
    setSelected(null);
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLButtonElement>(
        `[data-framework-id="${selectedId}"]`,
      ) ?? document.getElementById("catalog-title");
      target?.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!document.querySelector("dialog[open]")) search.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <>
      <a className="skip-link" href="#catalog-title">
        Skip to frameworks
      </a>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Quarry home">
          <Mark />
          quarry<span>.</span>
        </a>
        <span className="header-caption">Component framework discovery</span>
        <span className="header-count">
          <Layers3 size={14} /> 8 sample frameworks
        </span>
      </header>
      <main>
        <section className="search-section" aria-labelledby="search-title">
          <div className="eyebrow">START WITH YOUR PROJECT</div>
          <h1 id="search-title">What are you building?</h1>
          <p className="search-intro">
            Describe your application. Find frameworks with the
            <br className="desktop-break" /> components and capabilities to
            bring it to life.
          </p>
          <p className="mock-notice">Design mock · Sample catalog · Simulated recommendations</p>
          <form className="project-search" onSubmit={submit}>
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="project-query">
              What do you want to build?
            </label>
            <input
              ref={search}
              id="project-query"
              value={draft}
              maxLength={500}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="An animal hospital, an online store, a client portal…"
              aria-describedby="search-help"
            />
            {(draft || query) && (
              <button
                type="button"
                className="icon-button clear-search"
                aria-label="Clear search"
                onClick={() => {
                  setDraft("");
                  setQuery("");
                  search.current?.focus();
                }}
              >
                <X size={18} />
              </button>
            )}
            <button className="primary-button search-submit" type="submit">
              Find frameworks <ArrowRight size={17} />
            </button>
          </form>
          <div className="search-under">
            <div className="examples">
              <span>Try a project</span>
              {["Animal Hospital", "Online store", "Analytics dashboard"].map(
                (example) => (
                  <button key={example} onClick={() => searchExample(example)}>
                    {example}
                    <ArrowUpRight size={12} />
                  </button>
                ),
              )}
            </div>
            <kbd>
              <Command size={12} /> K
            </kbd>
          </div>
          <p className="search-help" id="search-help">
            Find a fit by purpose and capabilities. Customize any framework’s
            colors and skin during implementation.
          </p>
        </section>
        <section
          id="catalog"
          className="catalog"
          aria-labelledby="catalog-title"
        >
          <div className="results-heading">
            <div>
              <span className="eyebrow">
                {isSearching
                  ? "YOUR PROJECT, A STARTING POINT"
                  : "THE COLLECTION"}
              </span>
              <h2 id="catalog-title" tabIndex={-1}>
                {isSearching ? (
                  <>
                    Frameworks for <span>“{query}”</span>
                  </>
                ) : (
                  "Explore the frameworks"
                )}
              </h2>
              <p role="status">
                {isSearching
                  ? `${recommendations.results.length} ${recommendations.results.length === 1 ? "recommendation" : "recommendations"} · Ordered by relevance`
                  : `${recommendations.results.length} frameworks · Choose by what you need to build`}
              </p>
            </div>
            <div className="technology-filter">
              <label htmlFor="technology">Technology</label>
              <select
                id="technology"
                value={technology}
                onChange={(event) => setTechnology(event.target.value)}
              >
                {[
                  "All technologies",
                  "React",
                  "Angular",
                  "Vue",
                  "Web Components",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          {isSearching && recommendations.concepts.length > 0 && (
            <div className="intent-summary">
              <Sparkles size={15} />
              <span>Looking for</span>
              <strong>{recommendations.concepts.join(" · ")}</strong>
            </div>
          )}
          <div className="framework-grid">
            {recommendations.results.map(({ framework: f, reason }, index) => (
              <article
                className={`framework-card ${selected?.id === f.id ? "card-selected" : ""}`}
                key={f.id}
                aria-label={`${f.name} framework`}
              >
                <div className="card-top">
                  <span className="framework-icon">
                    <Layers3 size={21} />
                  </span>
                  <span className="tech-tag">{f.type}</span>
                  {isSearching && (
                    <span className="rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <h3>
                  {f.name}
                  {selected?.id === f.id && (
                    <span className="selected-label">
                      <Check size={13} /> Selected
                    </span>
                  )}
                </h3>
                <p className="framework-description">{f.description}</p>
                <Tags tags={f.tags} />
                {reason && (
                  <div className="recommendation-reason">
                    <span>
                      <Sparkles size={13} /> Why this fits
                    </span>
                    <p>{reason}</p>
                  </div>
                )}
                <div className="card-footer">
                  <span>{f.components} components</span>
                  <button
                    data-framework-id={f.id}
                    onClick={(event) =>
                      openDetail(f, event.currentTarget, reason)
                    }
                    aria-label={`Explore ${f.name}`}
                  >
                    Explore framework <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {recommendations.results.length === 0 && (
            <div className="empty-state">
              <Search size={27} />
              <h3>No recommendations in this sample catalog</h3>
              <p>
                Try describing your project’s tasks, choose another technology,
                or explore all frameworks.
              </p>
              <button className="secondary-button" onClick={reset}>
                Browse all frameworks <ArrowRight size={16} />
              </button>
            </div>
          )}
          {isSearching && recommendations.results.length > 0 && (
            <button className="browse-all" onClick={reset}>
              Browse all frameworks <ChevronRight size={15} />
            </button>
          )}
        </section>
      </main>
      <footer>
        <span>
          <Mark /> Built around what you’re building.
        </span>
        <span>Design mock · Sample catalog · Simulated recommendations</span>
      </footer>
      {selected && (
        <aside className="selection-bar" aria-label="Selected framework">
          <span className="selection-check">
            <Check size={19} />
          </span>
          <div>
            <small>SELECTED FRAMEWORK</small>
            <strong>
              {selected.name}
              <span>{selected.type}</span>
            </strong>
          </div>
          <button
            className="selection-review"
            onClick={(event) => openDetail(
              selected,
              event.currentTarget,
              recommendations.results.find((item) => item.framework.id === selected.id)?.reason ?? "",
            )}
          >
            View framework <ArrowUpRight size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Clear selected framework"
            onClick={clearSelection}
          >
            <X size={19} />
          </button>
        </aside>
      )}
      <div className="sr-only" role="status" aria-live={active ? "off" : "polite"}>
        {selected
          ? `${selected.name} selected as your framework.`
          : "No framework selected."}
      </div>
      {active && (
        <Detail
          key={active.framework.id}
          framework={active.framework}
          reason={active.reason}
          selected={selected?.id === active.framework.id}
          onSelect={() => setSelected(active.framework)}
          onClose={closeDetail}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
