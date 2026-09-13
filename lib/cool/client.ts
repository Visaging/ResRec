import { CooL } from "cool-nwc";

let coolInstance: CooL | null = null;

export function getCooLClient(): CooL {
  if (!coolInstance) {
    coolInstance = new CooL({
      applicationId: process.env.COOL_APPLICATION_ID || "resrec-integrity-system",
    });
  }
  return coolInstance;
}
