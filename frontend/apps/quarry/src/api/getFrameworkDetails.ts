import type { FrameworkDetails } from "../types/FrameworkDetails";

export async function getFrameworkDetails(id: string): Promise<FrameworkDetails> {
  const response = await fetch(`/api/frameworks/${id}`);
  if (!response.ok) {
    throw new Error("Framework details are unavailable.");
  }
  return response.json() as Promise<FrameworkDetails>;
}
