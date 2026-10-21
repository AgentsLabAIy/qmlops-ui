import type { EdgeData, NodeData } from '../../store/useWorkspaceStore';
import { Circuit, CompileLanguage, createInstruction, parseQasm, validateCircuit, validateQubitCount, MAX_OPERATIONS } from './circuit';
import { transpileQasm } from './transpilers/qasmTranspiler';
import { transpileQiskit } from './transpilers/qiskitTranspiler';

export type { Circuit, CompileLanguage, Instruction } from './circuit';

export function buildCircuit(nodes: NodeData[], edges: EdgeData[], qubits: number): Circuit {
  validateQubitCount(qubits);
  if (!nodes.length) throw new Error('Add at least one gate, module, or custom-code block before compiling.');
  if (nodes.length > MAX_OPERATIONS) throw new Error(`Circuits are limited to ${MAX_OPERATIONS} blocks.`);
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error('Workspace contains duplicate node IDs.');
  const incoming = new Map(nodes.map(node => [node.id, 0]));
  const outgoing = new Map(nodes.map(node => [node.id, new Set<string>()]));
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) throw new Error(`Wire ${edge.id} refers to a missing node.`);
    if (!outgoing.get(edge.source)!.has(edge.target)) {
      outgoing.get(edge.source)!.add(edge.target);
      incoming.set(edge.target, incoming.get(edge.target)! + 1);
    }
  }
  const ordered: NodeData[] = [];
  const remaining = new Set(nodes.map(node => node.id));
  while (remaining.size) {
    // Stable topological ordering: the earliest added ready block wins ties.
    const next = nodes.find(node => remaining.has(node.id) && incoming.get(node.id) === 0);
    if (!next) throw new Error('Circuit wires contain a cycle. Remove the cyclic connection before compiling.');
    remaining.delete(next.id);
    ordered.push(next);
    outgoing.get(next.id)!.forEach(target => incoming.set(target, incoming.get(target)! - 1));
  }
  const circuit: Circuit = { qubits, instructions: [] };
  for (const node of ordered) {
    try {
      if (node.type === 'Gate') {
        circuit.instructions.push(createInstruction(node.parameters.gate, node.parameters.qubits,
          node.parameters.angle, node.parameters.bit, qubits));
      } else if (['CustomCode', 'Module', 'Bell', 'GHZ'].includes(node.type)) {
        circuit.instructions.push(...parseQasm(node.parameters.source, qubits));
      } else {
        throw new Error(`Block type "${node.type}" has no gate definition. Replace it with supported gates or a module containing supported OpenQASM.`);
      }
      if (circuit.instructions.length > MAX_OPERATIONS) throw new Error(`Circuits are limited to ${MAX_OPERATIONS} operations.`);
    } catch (error) {
      throw new Error(`Block "${node.id}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  validateCircuit(circuit);
  return circuit;
}

export function compileWorkspace(nodes: NodeData[], edges: EdgeData[], qubits: number, language: CompileLanguage) {
  if (language !== 'qasm' && language !== 'qiskit') throw new Error('Choose QASM or Qiskit.');
  const circuit = buildCircuit(nodes, edges, qubits);
  return { circuit, code: language === 'qasm' ? transpileQasm(circuit) : transpileQiskit(circuit), language };
}