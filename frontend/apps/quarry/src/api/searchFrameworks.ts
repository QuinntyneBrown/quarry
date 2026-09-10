import type { FrameworkSearchResponse } from "../types/FrameworkSearchResponse";

export async function searchFrameworks(query: string): Promise<FrameworkSearchResponse> {
  const response = await fetch("/api/framework-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  if (!response.ok) {
    throw new Error("Framework search is unavailable.");
  }
  return response.json() as Promise<FrameworkSearchResponse>;
}
