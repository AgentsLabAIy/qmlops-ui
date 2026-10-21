const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Exercise the actual TypeScript services with Node's test runner, without a second compiler dependency.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { buildCircuit, compileWorkspace } = require('../src/services/compiler/index.ts');
const { GATES, parseQasm, parseAngle, createInstruction, validateCircuit } = require('../src/services/compiler/circuit.ts');
const { simulateCircuit } = require('../src/services/compiler/jsQuantumSimulator.ts');
const { transpileQasm } = require('../src/services/compiler/transpilers/qasmTranspiler.ts');
const { transpileQiskit } = require('../src/services/compiler/transpilers/qiskitTranspiler.ts');

const node = (id, gate, qubits, extra = {}) => ({ id, type: 'Gate', position: { x: 0, y: 0 }, parameters: { gate, qubits, ...extra } });
const codeNode = (source, type = 'CustomCode') => ({ id: 'code', type, position: { x: 0, y: 0 }, parameters: { source } });
const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const simulate = (instructions, qubits = 2) => {
  const result = simulateCircuit({ qubits, instructions });
  assert.equal(result.status, 'completed');
  near(result.basis.reduce((sum, item) => sum + item.probability, 0), 1);
  return result;
};
const instruction = (name, qubits, angle, bit) => createInstruction(name, qubits, angle, bit, 4);

test('Bell state compiles to both languages and has exact correlated probabilities', () => {
  const nodes = [node('h', 'h', [0]), node('cx', 'cx', [0, 1])];
  const qasm = compileWorkspace(nodes, [], 2, 'qasm');
  const qiskit = compileWorkspace(nodes, [], 2, 'qiskit');
  assert.deepEqual(qasm.circuit, qiskit.circuit);
  assert.equal(qasm.code, 'OPENQASM 3.0;\ninclude "stdgates.inc";\n\nqubit[2] q;\nbit[2] c;\n\nh q[0];\ncx q[0], q[1];\n');
  assert.match(qiskit.code, /QuantumCircuit\(2, 2\)\n\nqc\.h\(0\)\nqc\.cx\(0, 1\)/);
  const result = simulateCircuit(qasm.circuit);
  assert.equal(result.status, 'completed');
  assert.deepEqual(result.basis.map(item => item.bits), ['00', '11']);
  result.basis.forEach(item => near(item.probability, 0.5));
});

test('every supported gate round-trips through generated OpenQASM', () => {
  for (const gate of GATES) {
    const value = createInstruction(gate.name, Array.from({ length: gate.qubits }, (_, i) => i), 'pi/4', 2, 3);
    const circuit = { qubits: 3, instructions: [value] };
    assert.deepEqual(parseQasm(transpileQasm(circuit), 3), circuit.instructions, gate.name);
    assert.match(transpileQiskit(circuit), new RegExp(`qc\\.${gate.name}\\(`));
  }
});

test('Pauli gates and phase gates have correct complex amplitudes', () => {
  for (const gate of ['x', 'y']) {
    const result = simulate([instruction(gate, [0])], 1);
    assert.equal(result.basis[0].bits, '1');
    near(result.basis[0].real, gate === 'x' ? 1 : 0);
    near(result.basis[0].imaginary, gate === 'y' ? 1 : 0);
  }
  const phases = { z: Math.PI, s: Math.PI / 2, sdg: -Math.PI / 2, t: Math.PI / 4, tdg: -Math.PI / 4 };
  for (const [gate, angle] of Object.entries(phases)) {
    const result = simulate([instruction('h', [0]), instruction(gate, [0])], 1);
    const one = result.basis.find(item => item.bits === '1');
    near(one.real, Math.cos(angle) * Math.SQRT1_2);
    near(one.imaginary, Math.sin(angle) * Math.SQRT1_2);
  }
});

test('rotations use radians and preserve relative phase', () => {
  const rx = simulate([instruction('rx', [0], 'pi')], 1);
  near(rx.basis.find(item => item.bits === '1').imaginary, -1);
  const ry = simulate([instruction('ry', [0], 'pi/2')], 1);
  ry.basis.forEach(item => near(item.probability, 0.5));
  const rz = simulate([instruction('h', [0]), instruction('rz', [0], 'pi')], 1);
  near(rz.basis[0].imaginary, -Math.SQRT1_2);
  near(rz.basis[1].imaginary, Math.SQRT1_2);
});

test('controlled gates, SWAP, CCX and barriers act on specified operands', () => {
  const off = simulate([instruction('cx', [0, 1])]);
  assert.equal(off.basis[0].bits, '00');
  for (const gate of ['cx', 'cy']) {
    const result = simulate([instruction('x', [0]), instruction(gate, [0, 1])]);
    assert.equal(result.basis[0].bits, '11');
    near(result.basis[0].imaginary, gate === 'cy' ? 1 : 0);
  }
  const cz = simulate([instruction('x', [0]), instruction('x', [1]), instruction('cz', [0, 1])]);
  near(cz.basis[0].real, -1);
  const swapped = simulate([instruction('x', [0]), instruction('swap', [0, 1]), instruction('barrier', [0, 1])]);
  assert.equal(swapped.basis[0].bits, '10');
  const ccx = simulate([instruction('x', [0]), instruction('x', [1]), instruction('ccx', [0, 1, 2])], 3);
  assert.equal(ccx.basis[0].bits, '111');
  const ccxOff = simulate([instruction('x', [0]), instruction('ccx', [0, 1, 2])], 3);
  assert.equal(ccxOff.basis[0].bits, '001');
});

test('partial terminal measurements aggregate classical outcomes with explicit bit mapping', () => {
  const result = simulate([instruction('h', [0]), instruction('cx', [0, 1]), instruction('measure', [1], undefined, 0)]);
  assert.deepEqual(result.measuredBits, [0]);
  assert.deepEqual(result.measurements.map(item => item.bits), ['00', '01']);
  result.measurements.forEach(item => near(item.probability, 0.5));
  const marginalized = simulate([instruction('h', [0]), instruction('measure', [1], undefined, 1)]);
  assert.equal(marginalized.measurements.length, 1);
  near(marginalized.measurements[0].probability, 1);
});

test('wire dependencies determine stable topological ordering; cycles and invalid wires fail', () => {
  const nodes = [node('cx', 'cx', [0, 1]), node('h', 'h', [0]), node('z', 'z', [1])];
  const edge = { id: 'e', source: 'h', target: 'cx' };
  assert.deepEqual(buildCircuit(nodes, [edge], 2).instructions.map(i => i.gate), ['h', 'cx', 'z']);
  assert.deepEqual(buildCircuit(nodes, [], 2).instructions.map(i => i.gate), ['cx', 'h', 'z']);
  assert.throws(() => buildCircuit(nodes, [edge, { id: 'back', source: 'cx', target: 'h' }], 2), /cycle/);
  assert.throws(() => buildCircuit(nodes, [{ ...edge, target: 'missing' }], 2), /missing node/);
  assert.throws(() => buildCircuit([nodes[0], nodes[0]], [], 2), /duplicate node/);
});

test('custom source and modules expand consistently, including QASM 2 syntax', () => {
  const source = 'OPENQASM 2.0; include "qelib1.inc"; qreg q[3]; creg c[3]; // Bell\nh q[0]; cx q[0], q[1]; barrier q; measure q -> c;';
  const custom = buildCircuit([codeNode(source)], [], 3);
  const module = buildCircuit([codeNode(source, 'Module')], [], 3);
  assert.deepEqual(custom, module);
  assert.equal(custom.instructions.length, 6);
  assert.match(transpileQasm(custom), /c\[2\] = measure q\[2\];/);
  const ghz = buildCircuit([codeNode('h q[0]; cx q[0],q[1]; cx q[1],q[2];', 'GHZ')], [], 3);
  const result = simulateCircuit(ghz);
  assert.deepEqual(result.basis.map(item => item.bits), ['000', '111']);
});

test('invalid inputs and unsupported constructs fail rather than silently compiling', () => {
  const invalidSources = [
    '', 'h q[0]', 'reset q[0];', 'foo q[0];', 'h(pi) q[0];', 'rx q[0];', 'rx(1/0) q[0];',
    'h q[3];', 'cx q[0],q[0];', 'gate mine a { x a; };', 'if (c[0]) x q[0];',
    'for int i in [0:1] { h q[i]; };', 'import os;', 'qubit[2] q;', 'qubit[3] other;',
    'qubit[3] q; qubit[3] q;', 'h q;', 'c[0] = measure q[3];',
  ];
  for (const source of invalidSources) assert.throws(() => buildCircuit([codeNode(source)], [], 3), undefined, source);
  for (const count of [0, 34, 1.5, NaN, Infinity]) assert.throws(() => buildCircuit([node('a', 'x', [0])], [], count), /qubit count/);
  assert.throws(() => buildCircuit([], [], 2), /at least one/);
  assert.throws(() => buildCircuit([{ ...node('a', 'x', [0]), type: 'QNN' }], [], 2), /no gate definition/);
  assert.throws(() => buildCircuit([node('a', 'x', [-1])], [], 2), /Qubit index/);
  assert.throws(() => buildCircuit([node('a', 'measure', [0], { bit: 2 })], [], 2), /Classical bit/);
  assert.throws(() => parseAngle('alert(1)'), /Invalid angle/);
  assert.throws(() => parseAngle('pi/0'), /finite/);
  near(parseAngle('-pi/4'), -Math.PI / 4);
  near(parseAngle('1e-3'), 0.001);
});

test('mid-circuit and repeated measurements are rejected', () => {
  const measure = instruction('measure', [0], undefined, 0);
  assert.throws(() => validateCircuit({ qubits: 2, instructions: [measure, instruction('x', [1])] }), /terminal/);
  assert.throws(() => validateCircuit({ qubits: 2, instructions: [measure, measure] }), /only once/);
  assert.throws(() => validateCircuit({ qubits: 2, instructions: [measure, instruction('measure', [1], undefined, 0)] }), /only once/);
});

test('simulation boundary is exact: 16 works; 17 and 33 generate code but skip allocation', () => {
  const limit = compileWorkspace([node('x', 'x', [15])], [], 16, 'qasm');
  const result = simulateCircuit(limit.circuit);
  assert.equal(result.status, 'completed');
  assert.equal(result.basis[0].bits, '1000000000000000');
  for (const count of [17, 33]) {
    const compiled = compileWorkspace([node('x', 'x', [count - 1])], [], count, 'qiskit');
    assert.match(compiled.code, new RegExp(`QuantumCircuit\\(${count}, ${count}\\)`));
    assert.equal(simulateCircuit(compiled.circuit).status, 'skipped');
  }
});

test('operation and source limits reject excessive input', () => {
  assert.throws(() => buildCircuit([codeNode('x q[0];'.repeat(4097))], [], 1), /4096 operations/);
  assert.throws(() => parseQasm(' '.repeat(100001) + 'x q[0];', 1), /characters/);
  assert.throws(() => validateCircuit({ qubits: 1, instructions: Array(4097).fill(instruction('x', [0])) }), /4096 operations/);
});
