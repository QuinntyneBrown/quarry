import type { FrameworkDetails } from "../types/FrameworkDetails";
import { RateLimitError } from "./RateLimitError";
import { FrameworkNotFoundError } from "./FrameworkNotFoundError";

export async function getFrameworkDetails(id: string, signal?: AbortSignal): Promise<FrameworkDetails> {
  const response = await fetch(`/api/frameworks/${id}`, { signal });
  if (!response.ok) {
    if (response.status === 404) throw new FrameworkNotFoundError();
    if (response.status === 429) throw new RateLimitError(response.headers.get("Retry-After"));
    throw new Error("Framework details are unavailable.");
  }
  return response.json() as Promise<FrameworkDetails>;
}
