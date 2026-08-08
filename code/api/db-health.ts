import { handleDatabaseHealth } from "../backend/src/adapters/neon/database-health.js";

export function GET(): Promise<Response> {
  return handleDatabaseHealth();
}
