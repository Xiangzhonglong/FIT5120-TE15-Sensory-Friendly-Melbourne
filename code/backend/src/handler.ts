import { routeRequest } from "./http.js";
import type { HttpApiEvent, HttpResult } from "./types.js";

export async function handler(event: HttpApiEvent): Promise<HttpResult> {
  return routeRequest(event);
}
