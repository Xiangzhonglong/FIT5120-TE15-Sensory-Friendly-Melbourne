import { randomUUID } from "node:crypto";
import { routeRequest } from "./http.js";
import type { HttpApiEvent } from "./types.js";

export async function handleVercelRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.text();

  const event: HttpApiEvent = {
    rawPath: url.pathname,
    headers: Object.fromEntries(request.headers.entries()),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    ...(body === undefined ? {} : { body }),
    requestContext: {
      requestId: request.headers.get("x-vercel-id") ?? randomUUID(),
      http: {
        method,
        path: url.pathname
      }
    }
  };

  const result = await routeRequest(event);

  return new Response(result.body, {
    status: result.statusCode,
    headers: result.headers
  });
}
