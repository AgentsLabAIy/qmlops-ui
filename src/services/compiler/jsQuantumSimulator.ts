import { Circuit, Instruction, validateCircuit } from './circuit';

export const MAX_SIMULATION_QUBITS = 16;

export type SimulationResult =
  | { status: 'skipped'; message: string }
  | { status: 'completed'; qubits: number; basis: { bits: string; probability: number; real: number; imaginary: number }[];
      measurements: { bits: string; probability: number }[]; measuredBits: number[] };

type Complex = readonly [number, number];
type Matrix = readonly [Complex, Complex, Complex, Complex];

function matrixFor(instruction: Exclude<Instruction, { gate: 'measure' | 'barrier' }>): Matrix {
  const a = instruction.angle;
  switch (instruction.gate) {
    case 'h': { const s = Math.SQRT1_2; return [[s, 0], [s, 0], [s, 0], [-s, 0]]; }
    case 'x': case 'cx': case 'ccx': return [[0, 0], [1, 0], [1, 0], [0, 0]];
    case 'y': case 'cy': return [[0, 0], [0, -1], [0, 1], [0, 0]];
    case 'z': case 'cz': return [[1, 0], [0, 0], [0, 0], [-1, 0]];
    case 's': return [[1, 0], [0, 0], [0, 0], [0, 1]];
    case 'sdg': return [[1, 0], [0, 0], [0, 0], [0, -1]];
    case 't': return [[1, 0], [0, 0], [0, 0], [Math.SQRT1_2, Math.SQRT1_2]];
    case 'tdg': return [[1, 0], [0, 0], [0, 0], [Math.SQRT1_2, -Math.SQRT1_2]];
    case 'rx': return [[Math.cos(a! / 2), 0], [0, -Math.sin(a! / 2)], [0, -Math.sin(a! / 2)], [Math.cos(a! / 2), 0]];
    case 'ry': return [[Math.cos(a! / 2), 0], [-Math.sin(a! / 2), 0], [Math.sin(a! / 2), 0], [Math.cos(a! / 2), 0]];
    case 'rz': return [[Math.cos(a! / 2), -Math.sin(a! / 2)], [0, 0], [0, 0], [Math.cos(a! / 2), Math.sin(a! / 2)]];
    default: throw new Error(`No matrix implementation for ${instruction.gate}.`);
  }
}

export function simulateCircuit(circuit: Circuit): SimulationResult {
  validateCircuit(circuit);
  if (circuit.qubits > MAX_SIMULATION_QUBITS) {
    return { status: 'skipped', message: `Code generated. Browser simulation supports up to ${MAX_SIMULATION_QUBITS} qubits; this circuit has ${circuit.qubits}.` };
  }
  const size = 2 ** circuit.qubits;
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  real[0] = 1;
  for (const instruction of circuit.instructions) {
    if (instruction.gate === 'measure' || instruction.gate === 'barrier') continue;
    if (instruction.gate === 'swap') {
      const [a, b] = instruction.qubits.map(q => 1 << q);
      for (let i = 0; i < size; i++) {
        if (!(i & a) && (i & b)) {
          const j = i ^ a ^ b;
          [real[i], real[j]] = [real[j], real[i]];
          [imaginary[i], imaginary[j]] = [imaginary[j], imaginary[i]];
        }
      }
      continue;
    }
    const matrix = matrixFor(instruction);
    const target = 1 << instruction.qubits[instruction.qubits.length - 1];
    const controlMask = instruction.qubits.slice(0, -1).reduce((mask, q) => mask | (1 << q), 0);
    for (let i = 0; i < size; i++) {
      if ((i & target) || (i & controlMask) !== controlMask) continue;
      const j = i | target;
      const r0 = real[i], i0 = imaginary[i], r1 = real[j], i1 = imaginary[j];
      real[i] = matrix[0][0] * r0 - matrix[0][1] * i0 + matrix[1][0] * r1 - matrix[1][1] * i1;
      imaginary[i] = matrix[0][0] * i0 + matrix[0][1] * r0 + matrix[1][0] * i1 + matrix[1][1] * r1;
      real[j] = matrix[2][0] * r0 - matrix[2][1] * i0 + matrix[3][0] * r1 - matrix[3][1] * i1;
      imaginary[j] = matrix[2][0] * i0 + matrix[2][1] * r0 + matrix[3][0] * i1 + matrix[3][1] * r1;
    }
  }
  const basis = [];
  const measurements = new Map<number, number>();
  const measurementInstructions = circuit.instructions.filter(i => i.gate === 'measure');
  const measuredBits = measurementInstructions.map(i => i.bit).sort((a, b) => b - a);
  for (let i = 0; i < size; i++) {
    const probability = real[i] ** 2 + imaginary[i] ** 2;
    // Exact-zero states are omitted, but small nonzero probabilities remain available.
    if (probability === 0) continue;
    basis.push({ bits: i.toString(2).padStart(circuit.qubits, '0'), probability, real: real[i], imaginary: imaginary[i] });
    if (measuredBits.length) {
      let outcome = 0;
      for (const instruction of measurementInstructions) {
        if (i & (1 << instruction.qubits[0])) outcome += 2 ** instruction.bit;
      }
      measurements.set(outcome, (measurements.get(outcome) || 0) + probability);
    }
  }
  return { status: 'completed', qubits: circuit.qubits, basis, measuredBits,
    measurements: Array.from(measurements, ([bits, probability]) => ({ bits: bits.toString(2).padStart(circuit.qubits, '0'), probability })) };
}