import React from 'react';
import { useWorkspaceStore, ModuleTemplate } from '../../store/useWorkspaceStore';
import { GATES, createWorkspaceNode } from '../../services/compiler/circuit';

export const NativePrimitives: React.FC = () => {
  const { addNode, moduleTemplates } = useWorkspaceStore();
  const handleDragStart = (e: React.DragEvent, nodeType: string, template?: ModuleTemplate) => {
    e.dataTransfer.setData('application/quantum-studio-type', nodeType);
    if (template) e.dataTransfer.setData('application/quantum-studio-template', template.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const add = (type: string, template?: ModuleTemplate) => {
    const node = createWorkspaceNode(type, { x: 50, y: 150 });
    if (template) node.parameters = { name: template.name, source: template.source };
    addNode(node);
  };
  const item = (type: string, label: string, template?: ModuleTemplate) => (
    <button key={template?.id || type} type="button" draggable
      onDragStart={e => handleDragStart(e, type, template)} onClick={() => add(type, template)}
      className="p-2 bg-slate-950 border border-slate-800 rounded text-left text-slate-300 hover:border-cyan-700 cursor-grab">
      {label}
    </button>
  );

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Quantum gates</h3>
      <p className="text-[10px] text-slate-500">Click to add or drag onto the canvas. Select a block to edit attributes here.</p>
      <div className="grid grid-cols-3 gap-1">
        {GATES.map(gate => item(gate.name, gate.name.toUpperCase()))}
      </div>
      <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Modules and custom code</h3>
      <div className="grid gap-1">
        {item('Bell', 'Bell pair (2 qubits)')}
        {item('GHZ', 'GHZ (3 qubits)')}
        {item('Module', 'Custom reusable module')}
        {item('CustomCode', 'Custom OpenQASM code')}
        {moduleTemplates.map(template => item('Module', template.name, template))}
      </div>
      <details>
        <summary className="text-slate-500 cursor-pointer">Blueprint placeholders (not compilable)</summary>
        <div className="grid gap-1 pt-2">
          {item('CustomGate', 'Undefined custom gate')}
          {item('QNN', 'QNN Layer Mold')}
          {item('QRAM', 'QRAM Matrix Array')}
        </div>
      </details>
    </div>
  );
};
