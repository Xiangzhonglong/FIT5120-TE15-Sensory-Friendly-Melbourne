import { handleDatabaseHealth } from "../backend/src/adapters/neon/database-health.js";

export default function handler(): Promise<Response> {
  return handleDatabaseHealth();
}
