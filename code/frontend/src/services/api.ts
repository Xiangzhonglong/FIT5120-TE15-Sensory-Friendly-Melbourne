import type { ApiError, RouteSearchRequest, RouteSearchResponse } from "@sensory-melbourne/contracts";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

export async function searchRoutes(request: RouteSearchRequest): Promise<RouteSearchResponse> {
  const response = await fetch(`${baseUrl}/routes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(payload?.error.message ?? "Route search is temporarily unavailable.");
  }
  return response.json() as Promise<RouteSearchResponse>;
}
