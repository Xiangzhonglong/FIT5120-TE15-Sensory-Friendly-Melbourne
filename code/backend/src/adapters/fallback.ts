import type { ProviderResult } from "../ports/provider-result.js";
import type { Logger } from "../ports/logger.js";
import { ApplicationError } from "../errors.js";

export type ProviderAttempt<T> = {
  name: string;
  execute: () => Promise<ProviderResult<T>>;
};

export async function executeWithFallback<T>(
  operation: string,
  attempts: ProviderAttempt<T>[],
  logger: Logger
): Promise<ProviderResult<T>> {
  const failures: string[] = [];

  for (const attempt of attempts) {
    try {
      const result = await attempt.execute();
      if (failures.length === 0) return result;
      return {
        ...result,
        status: {
          ...result.status,
          fallbackReason: failures.join("; ")
        }
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown provider failure";
      failures.push(`${attempt.name}: ${reason}`);
      logger.warn("provider_attempt_failed", { operation, provider: attempt.name, reason });
    }
  }

  throw new ApplicationError(
    "UPSTREAM_UNAVAILABLE",
    `${operation} is temporarily unavailable after all configured fallbacks failed.`,
    503
  );
}
