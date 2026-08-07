import type { LogFields, Logger } from "./ports/logger.js";

function write(level: "INFO" | "WARN" | "ERROR", event: string, fields: LogFields = {}): void {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields
  };
  const output = JSON.stringify(entry);
  if (level === "ERROR") console.error(output);
  else if (level === "WARN") console.warn(output);
  else console.info(output);
}

export const consoleLogger: Logger = {
  info: (event, fields) => write("INFO", event, fields),
  warn: (event, fields) => write("WARN", event, fields),
  error: (event, fields) => write("ERROR", event, fields)
};

export const noopLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};
