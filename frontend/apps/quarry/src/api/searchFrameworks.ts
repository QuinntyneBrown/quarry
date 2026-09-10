import type { FrameworkSearchResponse } from "../types/FrameworkSearchResponse";
import type { Technology } from "../types/Technology";

export async function searchFrameworks(query: string, technology: Technology): Promise<FrameworkSearchResponse> {
  const response = await fetch("/api/framework-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, technology: technology === "All technologies" ? undefined : technology })
  });
  if (!response.ok) {
    throw new Error("Framework search is unavailable.");
  }
  return response.json() as Promise<FrameworkSearchResponse>;
}
