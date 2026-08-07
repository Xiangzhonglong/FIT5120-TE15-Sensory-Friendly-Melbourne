import { neon } from "@neondatabase/serverless";

export type DatabaseProbe = () => Promise<void>;

export async function probeNeonDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const sql = neon(databaseUrl);
  await sql`SELECT 1`;
}

export async function handleDatabaseHealth(
  probe: DatabaseProbe = probeNeonDatabase
): Promise<Response> {
  try {
    await probe();

    return Response.json(
      { status: "ok", database: "reachable" },
      {
        status: 200,
        headers: { "cache-control": "no-store" }
      }
    );
  } catch {
    return Response.json(
      { status: "error", database: "unavailable" },
      {
        status: 503,
        headers: { "cache-control": "no-store" }
      }
    );
  }
}
