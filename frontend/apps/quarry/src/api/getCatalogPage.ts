import type { CatalogPage } from "../types/CatalogPage";

export async function getCatalogPage(): Promise<CatalogPage> {
  const response = await fetch("/api/frameworks");
  if (!response.ok) {
    throw new Error("The catalog is unavailable.");
  }
  return response.json() as Promise<CatalogPage>;
}
