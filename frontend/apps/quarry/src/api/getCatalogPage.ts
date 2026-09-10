import type { CatalogPage } from "../types/CatalogPage";
import type { Technology } from "../types/Technology";

export async function getCatalogPage(technology: Technology = "All technologies", cursor?: string): Promise<CatalogPage> {
  const parameters = new URLSearchParams();
  if (technology !== "All technologies") {
    parameters.set("technology", technology);
  }
  if (cursor) {
    parameters.set("cursor", cursor);
  }
  const queryString = parameters.toString();
  const response = await fetch(`/api/frameworks${queryString ? `?${queryString}` : ""}`);
  if (!response.ok) {
    throw new Error("The catalog is unavailable.");
  }
  return response.json() as Promise<CatalogPage>;
}
