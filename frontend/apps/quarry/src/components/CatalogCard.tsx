import { memo } from "react";
import type { CatalogCardProperties } from "../types/CatalogCardProperties";

export const CatalogCard = memo(function CatalogCard({ framework, recommendation, isSelected, onExplore }: CatalogCardProperties): React.JSX.Element {
  return <article className={`framework-card${isSelected ? " card-selected" : ""}`} aria-label={`${framework.name} framework`}>
    <div className="card-top"><span className="framework-icon" aria-hidden="true">◇</span><span>{framework.technology}</span>{recommendation && <span className="rank">Rank {recommendation.rank}</span>}</div>
    <h3>{framework.name}</h3>{isSelected && <p className="selected-label">✓ Selected</p>}
    <p className="framework-description">{framework.description}</p>
    <ul className="tags" aria-label="Framework tags">{framework.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
    {recommendation && <section className="recommendation-reason"><h4>Why it fits your project</h4><p>{recommendation.explanation}</p></section>}
    <div className="card-footer"><span>{framework.componentCount} components</span><button id={`framework-details-${framework.id}`} type="button" onClick={(event) => onExplore(framework.id, event.currentTarget)}>Explore {framework.name}<span aria-hidden="true">↗</span></button></div>
  </article>;
});
