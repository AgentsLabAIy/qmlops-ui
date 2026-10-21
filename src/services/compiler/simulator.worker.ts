/// <reference lib="webworker" />

import { Circuit } from './circuit';
import { simulateCircuit, SimulationResult } from './jsQuantumSimulator';

export type SimulatorResponse = { ok: true; result: SimulationResult } | { ok: false; error: string };

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<Circuit>) => {
  let response: SimulatorResponse;
  try {
    response = { ok: true, result: simulateCircuit(event.data) };
  } catch (error) {
    response = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  self.postMessage(response);
};
