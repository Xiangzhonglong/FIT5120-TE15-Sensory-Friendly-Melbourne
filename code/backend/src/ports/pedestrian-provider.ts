import type { PedestrianSensor } from "../domain.js";
import type { ProviderResult } from "./provider-result.js";

export interface PedestrianProvider {
  getCurrentSensors(): Promise<ProviderResult<PedestrianSensor[]>>;
}
