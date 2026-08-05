import { sensors } from "../../data/mock-data.js";
import type { PedestrianProvider } from "../../ports/pedestrian-provider.js";
import { mockStatus } from "./mock-status.js";

export class MockPedestrianProvider implements PedestrianProvider {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async getCurrentSensors() {
    return {
      data: sensors,
      status: mockStatus("Deterministic pedestrian fixture", this.now().toISOString(), "MEDIUM")
    };
  }
}
