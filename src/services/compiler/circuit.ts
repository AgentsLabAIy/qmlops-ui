import type { NodeData } from '../../store/useWorkspaceStore';

export const GATES = [
  { name: 'h', qubits: 1, rotation: false },
  { name: 'x', qubits: 1, rotation: false },
  { name: 'y', qubits: 1, rotation: false },
  { name: 'z', qubits: 1, rotation: false },
  { name: 's', qubits: 1, rotation: false },
  { name: 'sdg', qubits: 1, rotation: false },
  { name: 't', qubits: 1, rotation: false },
  { name: 'tdg', qubits: 1, rotation: false },
  { name: 'rx', qubits: 1, rotation: true },
  { name: 'ry', qubits: 1, rotation: true },
  { name: 'rz', qubits: 1, rotation: true },
  { name: 'cx', qubits: 2, rotation: false },
  { name: 'cy', qubits: 2, rotation: false },
  { name: 'cz', qubits: 2, rotation: false },
  { name: 'swap', qubits: 2, rotation: false },
  { name: 'ccx', qubits: 3, rotation: false },
  { name: 'measure', qubits: 1, rotation: false },
  { name: 'barrier', qubits: 1, rotation: false },
] as const;

export type GateName = typeof GATES[number]['name'];
export type UnitaryGate = Exclude<GateName, 'measure' | 'barrier'>;
export type Instruction =
  | { gate: UnitaryGate; qubits: number[]; angle?: number }
  | { gate: 'measure'; qubits: number[]; bit: number }
  | { gate: 'barrier'; qubits: number[] };

export interface Circuit {
  qubits: number;
  instructions: Instruction[];
}

export type CompileLanguage = 'qasm' | 'qiskit';
export const MAX_OPERATIONS = 4096;
export const MAX_CODE_LENGTH = 100000;

export function gateDefinition(name: unknown) {
  const definition = GATES.find(gate => gate.name === name);
  if (!definition) throw new Error(`Unsupported gate "${String(name)}".`);
  return definition;
}

export function parseAngle(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') throw new Error('Angle must be a finite number or pi fraction.');
  const match = value.replace(/\s/g, '').match(/^([+-]?)(pi|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?:\/((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?))?$/i);
  if (!match) throw new Error(`Invalid angle "${value}". Use radians, pi, -pi/2, or pi/4.`);
  const angle = (match[1] === '-' ? -1 : 1) *
    (match[2].toLowerCase() === 'pi' ? Math.PI : Number(match[2])) /
    (match[3] ? Number(match[3]) : 1);
  if (!Number.isFinite(angle)) throw new Error('Angle must be finite; division by zero is not supported.');
  return angle;
}

export function validateQubitCount(qubits: number) {
  if (!Number.isInteger(qubits) || qubits < 1 || qubits > 33) {
    throw new Error('Global qubit count must be an integer between 1 and 33.');
  }
}

function validateIndex(value: unknown, count: number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= count) {
    throw new Error(`${label} must be an integer between 0 and ${count - 1}.`);
  }
  return value;
}

export function createInstruction(name: unknown, operands: unknown, angle: unknown, bit: unknown, count: number): Instruction {
  const definition = gateDefinition(name);
  if (!Array.isArray(operands) || (definition.name !== 'barrier' && operands.length !== definition.qubits) || !operands.length) {
    throw new Error(`${definition.name.toUpperCase()} requires ${definition.qubits} qubit operand(s).`);
  }
  const qubits = operands.map(value => validateIndex(value, count, 'Qubit index'));
  if (new Set(qubits).size !== qubits.length) throw new Error('Gate operands must refer to distinct qubits.');
  if (definition.name === 'measure') {
    return { gate: 'measure', qubits, bit: validateIndex(bit, count, 'Classical bit index') };
  }
  if (definition.name === 'barrier') return { gate: 'barrier', qubits };
  return definition.rotation
    ? { gate: definition.name, qubits, angle: parseAngle(angle) }
    : { gate: definition.name, qubits };
}

export function validateCircuit(circuit: Circuit) {
  validateQubitCount(circuit.qubits);
  if (circuit.instructions.length > MAX_OPERATIONS) {
    throw new Error(`Circuits are limited to ${MAX_OPERATIONS} operations.`);
  }
  let measuring = false;
  const measuredQubits = new Set<number>();
  const measuredBits = new Set<number>();
  for (const instruction of circuit.instructions) {
    createInstruction(instruction.gate, instruction.qubits, 'angle' in instruction ? instruction.angle : undefined,
      instruction.gate === 'measure' ? instruction.bit : undefined, circuit.qubits);
    if (instruction.gate === 'measure') {
      if (measuredQubits.has(instruction.qubits[0]) || measuredBits.has(instruction.bit)) {
        throw new Error('Each qubit and classical bit may be measured only once.');
      }
      measuring = true;
      measuredQubits.add(instruction.qubits[0]);
      measuredBits.add(instruction.bit);
    } else if (instruction.gate !== 'barrier' && measuring) {
      throw new Error('Only terminal measurements are supported. Move all measurements after quantum gates.');
    }
  }
}

export function parseQasm(source: unknown, count: number): Instruction[] {
  if (typeof source !== 'string' || !source.trim()) throw new Error('Custom code or module source is empty.');
  if (source.length > MAX_CODE_LENGTH) throw new Error(`Custom code is limited to ${MAX_CODE_LENGTH} characters.`);
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '').trim();
  if (!text.endsWith(';')) throw new Error('Every OpenQASM statement must end with a semicolon.');
  const instructions: Instruction[] = [];
  const declared = new Set<string>();
  const operand = (token: string, register: string) => {
    const match = token.trim().match(new RegExp(`^${register}\\[(\\d+)\\]$`));
    if (!match) throw new Error(`Expected ${register}[index], received "${token.trim()}".`);
    return Number(match[1]);
  };
  for (const raw of text.split(';')) {
    const statement = raw.trim();
    if (!statement) continue;
    if (/^OPENQASM\s+(2\.0|3\.0)$/i.test(statement) || /^include\s+"(stdgates|qelib1)\.inc"$/.test(statement)) continue;
    const declaration = statement.match(/^(qubit|bit)\s*\[(\d+)\]\s*([qc])$/) ||
      (() => {
        const legacy = statement.match(/^(qreg|creg)\s+([qc])\[(\d+)\]$/);
        return legacy ? [legacy[0], legacy[1], legacy[3], legacy[2]] : null;
      })();
    if (declaration) {
      const register = declaration[1] === 'qubit' || declaration[1] === 'qreg' ? 'q' : 'c';
      if (declaration[3] !== register || Number(declaration[2]) !== count || declared.has(register)) {
        throw new Error(`Declare ${register} only once with size ${count}, matching global qubits.`);
      }
      declared.add(register);
      continue;
    }
    if (statement === 'measure q -> c' || statement === 'c = measure q') {
      for (let q = 0; q < count; q++) instructions.push(createInstruction('measure', [q], undefined, q, count));
    } else {
      const measure = statement.match(/^measure\s+(q\[\d+\])\s*->\s*(c\[\d+\])$/);
      const assignment = statement.match(/^(c\[\d+\])\s*=\s*measure\s+(q\[\d+\])$/);
      if (measure || assignment) {
        instructions.push(createInstruction('measure', [operand(measure ? measure[1] : assignment![2], 'q')],
          undefined, operand(measure ? measure[2] : assignment![1], 'c'), count));
      } else if (statement === 'barrier q') {
        instructions.push({ gate: 'barrier', qubits: Array.from({ length: count }, (_, i) => i) });
      } else {
        const gate = statement.replace(/^ctrl\s*@\s*y\s+/, 'cy ').match(/^([a-z]+)(?:\(([^()]*)\))?\s+(.+)$/);
        if (!gate) throw new Error(`Unsupported OpenQASM statement "${statement}".`);
        const definition = gateDefinition(gate[1]);
        if (definition.name === 'measure' || definition.rotation !== (gate[2] !== undefined)) {
          throw new Error(`Invalid parameters for ${gate[1]}.`);
        }
        instructions.push(createInstruction(gate[1], gate[3].split(',').map(token => operand(token, 'q')), gate[2], undefined, count));
      }
    }
    if (instructions.length > MAX_OPERATIONS) throw new Error(`Circuits are limited to ${MAX_OPERATIONS} operations.`);
  }
  if (!instructions.length) throw new Error('Custom code must contain at least one supported operation.');
  return instructions;
}

export function defaultParameters(type: string): NodeData['parameters'] {
  if (GATES.some(gate => gate.name === type)) {
    const gate = gateDefinition(type);
    return { gate: type, qubits: Array.from({ length: gate.qubits }, (_, i) => i), ...(gate.rotation ? { angle: 'pi/2' } : {}), ...(type === 'measure' ? { bit: 0 } : {}) };
  }
  if (type === 'Bell') return { name: 'Bell pair', source: 'h q[0];\ncx q[0], q[1];' };
  if (type === 'GHZ') return { name: 'GHZ (3 qubits)', source: 'h q[0];\ncx q[0], q[1];\ncx q[1], q[2];' };
  if (type === 'Module') return { name: 'My module', source: 'h q[0];\nx q[1];' };
  if (type === 'CustomCode') return { source: 'h q[0];\ncx q[0], q[1];' };
  return type === 'QNN' ? { layers: 4 } : { addressMode: 'Direct' };
}

export function createWorkspaceNode(type: string, position: NodeData['position']): NodeData {
  return { id: `${type.toLowerCase()}_${crypto.randomUUID()}`, type: GATES.some(g => g.name === type) ? 'Gate' : type,
    position, parameters: defaultParameters(type) };
}
