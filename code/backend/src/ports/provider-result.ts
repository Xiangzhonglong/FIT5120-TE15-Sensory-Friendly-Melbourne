import type { DataSourceStatus } from "@sensory-melbourne/contracts";

export type ProviderResult<T> = {
  data: T;
  status: DataSourceStatus;
};
