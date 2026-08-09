import type {
  ApiError,
  ApiErrorCode,
  RouteSearchRequest,
  RouteSearchResponse
} from "@sensory-melbourne/contracts";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

export class RouteSearchError extends Error {
  readonly code: ApiErrorCode;
  readonly requestId: string | undefined;
  readonly status: number;

  constructor(message: string, code: ApiErrorCode, status: number, requestId?: string) {
    super(message);
    this.name = "RouteSearchError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export async function searchRoutes(request: RouteSearchRequest): Promise<RouteSearchResponse> {
  const response = await fetch(`${baseUrl}/routes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new RouteSearchError(
      payload?.error?.message ?? "Route search is temporarily unavailable.",
      payload?.error?.code ?? "INTERNAL_ERROR",
      response.status,
      payload?.error?.requestId
    );
  }
  return response.json() as Promise<RouteSearchResponse>;
}
