import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { routeRequest } from "./http.js";

const port = Number(process.env.PORT ?? 3001);

createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const result = await routeRequest({
    rawPath: url.pathname,
    body: chunks.length ? Buffer.concat(chunks).toString("utf8") : null,
    headers: Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(",") : value
      ])
    ),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    requestContext: {
      requestId: randomUUID(),
      http: { method: request.method ?? "GET", path: url.pathname }
    }
  });

  response.writeHead(result.statusCode, result.headers);
  response.end(result.body);
}).listen(port, () => {
  console.log(`Sensory Melbourne API listening on http://localhost:${port}`);
});
