import type { CatalogCardProperties } from "../types/CatalogCardProperties";

export function CatalogCard({ framework, recommendation, isSelected, onExplore }: CatalogCardProperties): React.JSX.Element {
  return <article aria-label={`${framework.name} framework`}><h2>{framework.name}</h2>{isSelected && <p>Selected</p>}{recommendation && <p>Rank {recommendation.rank}</p>}<p>{framework.description}</p><p>{framework.tags.join(", ")}</p><p>{framework.technology} · {framework.componentCount} components</p>{recommendation && <p>{recommendation.explanation}</p>}<button id={`framework-details-${framework.id}`} type="button" onClick={(event) => onExplore(framework.id, event.currentTarget)}>Explore {framework.name}</button></article>;
}
