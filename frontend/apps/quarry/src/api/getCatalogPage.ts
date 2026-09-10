import type { CatalogPage } from "../types/CatalogPage";
import type { Technology } from "../types/Technology";

export async function getCatalogPage(technology: Technology = "All technologies"): Promise<CatalogPage> {
  const parameters = technology === "All technologies" ? "" : `?technology=${encodeURIComponent(technology)}`;
  const response = await fetch(`/api/frameworks${parameters}`);
  if (!response.ok) {
    throw new Error("The catalog is unavailable.");
  }
  return response.json() as Promise<CatalogPage>;
}
