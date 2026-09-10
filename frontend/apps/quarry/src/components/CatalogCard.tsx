import type { CatalogCardProperties } from "../types/CatalogCardProperties";

export function CatalogCard({ framework, onExplore }: CatalogCardProperties): React.JSX.Element {
  return <article aria-label={`${framework.name} framework`}><h2>{framework.name}</h2><p>{framework.description}</p><p>{framework.technology} · {framework.componentCount} components</p><button type="button" onClick={(event) => onExplore(framework.id, event.currentTarget)}>Explore {framework.name}</button></article>;
}
