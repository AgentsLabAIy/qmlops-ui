/**
 * QUANTUM LAYER INTERFACE STUB
 * Strict boundary between the Frontend UI and future mathematical quantum execution.
 */

export interface ArtifactDataPayload {
  id: string;
  type: string;
  globalQubitCount: number;
  parameters: Record<string, any>;
}

export const compileToQASM = (nodes: ArtifactDataPayload[], globalN: number): string => {
  let qasmString = `OPENQASM 3.0;\ninclude "stdgates.inc";\n\n`;
  qasmString += `qreg q[${globalN}];\ncreg c[${globalN}];\n\n`;

  if (nodes.length === 0) return qasmString + `// Canvas Viewport Empty`;

  nodes.forEach((node) => {
    qasmString += `// --- ARTIFACT: ${node.type} (${node.id}) ---\n`;
    if (node.type === 'QNN') {
      qasmString += `// Parametric architecture layer loop depth: ${node.parameters.layers || 4}\n`;
    } else if (node.type === 'QRAM') {
      qasmString += `// Address configuration: ${node.parameters.addressMode || 'Direct'}\n`;
    }
    qasmString += `\n`;
  });

  return qasmString;
};
