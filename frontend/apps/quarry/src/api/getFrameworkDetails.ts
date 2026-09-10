import type { FrameworkDetails } from "../types/FrameworkDetails";
import { RateLimitError } from "./RateLimitError";

export async function getFrameworkDetails(id: string): Promise<FrameworkDetails> {
  const response = await fetch(`/api/frameworks/${id}`);
  if (!response.ok) {
    if (response.status === 429) throw new RateLimitError(response.headers.get("Retry-After"));
    throw new Error("Framework details are unavailable.");
  }
  return response.json() as Promise<FrameworkDetails>;
}
