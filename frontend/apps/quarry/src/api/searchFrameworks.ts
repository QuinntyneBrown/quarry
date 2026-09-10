import type { FrameworkSearchResponse } from "../types/FrameworkSearchResponse";
import type { Technology } from "../types/Technology";
import { RateLimitError } from "./RateLimitError";

export async function searchFrameworks(query: string, technology: Technology): Promise<FrameworkSearchResponse> {
  const response = await fetch("/api/framework-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, technology: technology === "All technologies" ? undefined : technology })
  });
  if (!response.ok) {
    if (response.status === 429) throw new RateLimitError(response.headers.get("Retry-After"));
    throw new Error("Framework search is unavailable.");
  }
  return response.json() as Promise<FrameworkSearchResponse>;
}
