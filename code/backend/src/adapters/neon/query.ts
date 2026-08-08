import { neon } from "@neondatabase/serverless";

export type DatabaseQuery = <T extends Record<string, unknown>>(
  query: string,
  parameters?: unknown[]
) => Promise<T[]>;

export function createNeonQuery(databaseUrl: string): DatabaseQuery {
  const sql = neon(databaseUrl);
  return async <T extends Record<string, unknown>>(query: string, parameters: unknown[] = []) => {
    const rows = await sql.query(query, parameters);
    return rows as T[];
  };
}
