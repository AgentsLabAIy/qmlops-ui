import { Circuit, validateCircuit } from '../circuit';

export function transpileQiskit(circuit: Circuit): string {
  validateCircuit(circuit);
  const lines = ['from qiskit import QuantumCircuit', '', `qc = QuantumCircuit(${circuit.qubits}, ${circuit.qubits})`, ''];
  for (const instruction of circuit.instructions) {
    if (instruction.gate === 'measure') lines.push(`qc.measure(${instruction.qubits[0]}, ${instruction.bit})`);
    else {
      const args = [...('angle' in instruction ? [instruction.angle] : []), ...instruction.qubits];
      lines.push(`qc.${instruction.gate}(${args.join(', ')})`);
    }
  }
  lines.push('', 'print(qc.draw(output="text"))');
  return lines.join('\n') + '\n';
}