import type { FrameworkSearchResponse } from "../types/FrameworkSearchResponse";
import type { Technology } from "../types/Technology";
import { RateLimitError } from "./RateLimitError";
import { SearchValidationError } from "./SearchValidationError";

export async function searchFrameworks(query: string, technology: Technology, signal?: AbortSignal): Promise<FrameworkSearchResponse> {
  const response = await fetch("/api/framework-searches", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, technology: technology === "All technologies" ? undefined : technology })
  });
  if (!response.ok) {
    if (response.status === 429) throw new RateLimitError(response.headers.get("Retry-After"));
    if (response.status === 400) {
      const body: unknown = await response.json().catch(() => undefined);
      if (body && typeof body === "object" && "code" in body && body.code === "invalid_search_query") throw new SearchValidationError();
    }
    throw new Error("Framework search is unavailable.");
  }
  return response.json() as Promise<FrameworkSearchResponse>;
}
