import { Circuit, validateCircuit } from '../circuit';

export function transpileQasm(circuit: Circuit): string {
  validateCircuit(circuit);
  const lines = ['OPENQASM 3.0;', 'include "stdgates.inc";', '', `qubit[${circuit.qubits}] q;`, `bit[${circuit.qubits}] c;`, ''];
  for (const instruction of circuit.instructions) {
    const operands = instruction.qubits.map(q => `q[${q}]`).join(', ');
    if (instruction.gate === 'measure') lines.push(`c[${instruction.bit}] = measure ${operands};`);
    else {
      const gate = instruction.gate === 'cy'
        ? 'ctrl @ y'
        : instruction.gate;
      lines.push(`${gate}${'angle' in instruction ? `(${instruction.angle})` : ''} ${operands};`);
    }
  }
  return lines.join('\n') + '\n';
}