import type { ApiErrorCode } from "@sensory-melbourne/contracts";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
