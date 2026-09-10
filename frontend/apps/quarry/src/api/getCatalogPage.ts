import type { CatalogPage } from "../types/CatalogPage";
import type { Technology } from "../types/Technology";
import { CatalogRevisionChangedError } from "./CatalogRevisionChangedError";

export async function getCatalogPage(technology: Technology = "All technologies", cursor?: string, expectedRevision?: string): Promise<CatalogPage> {
  const parameters = new URLSearchParams();
  if (technology !== "All technologies") {
    parameters.set("technology", technology);
  }
  if (cursor) {
    parameters.set("cursor", cursor);
  }
  if (expectedRevision) parameters.set("expectedRevision", expectedRevision);
  const queryString = parameters.toString();
  const response = await fetch(`/api/frameworks${queryString ? `?${queryString}` : ""}`);
  if (!response.ok) {
    if (response.status === 409) throw new CatalogRevisionChangedError();
    throw new Error("The catalog is unavailable.");
  }
  return response.json() as Promise<CatalogPage>;
}
