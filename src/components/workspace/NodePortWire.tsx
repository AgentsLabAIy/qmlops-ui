import React, { useState } from 'react';
import { useWorkspaceStore, NodeData } from '../../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../../store/useGlobalQubitStore';
import { GATES, defaultParameters } from '../../services/compiler/circuit';
import { buildCircuit } from '../../services/compiler';

interface NodePortWireProps {
  activeNode: NodeData | null;
  onClose: () => void;
}

export const NodePortWrite: React.FC<NodePortWireProps> = ({ activeNode, onClose }) => {
  const { nodes, setWorkspaceState, edges, removeNode, addModuleTemplate } = useWorkspaceStore();
  const { globalQubits } = useGlobalQubitStore();
  const [moduleMessage, setModuleMessage] = useState('');

  if (!activeNode) return null;

  const updateParameterField = (key: string, value: unknown) => {
    setModuleMessage('');
    const amendedNodes = nodes.map((node) => {
      if (node.id === activeNode.id) {
        return {
          ...node,
          parameters: { ...node.parameters, [key]: value }
        };
      }
      return node;
    });
    setWorkspaceState(amendedNodes, edges);
  };

  const gate = GATES.find(item => item.name === activeNode.parameters.gate);
  const codeBlock = ['CustomCode', 'Module', 'Bell', 'GHZ'].includes(activeNode.type);
  const fieldClass = 'w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono';
  const saveModule = () => {
    try {
      buildCircuit([activeNode], [], globalQubits);
      const name = String(activeNode.parameters.name || 'Custom module').trim();
      if (!name) throw new Error('Enter a module name.');
      addModuleTemplate({ id: crypto.randomUUID(), name, source: activeNode.parameters.source });
      setModuleMessage('Module added to the left palette for this browser session.');
    } catch (error) {
      setModuleMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleComponentPurge = () => {
    removeNode(activeNode.id);
    onClose();
  };

  return (
    <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-4 font-sans text-left">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Block attributes
        </span>
        <button onClick={onClose} className="text-[9px] font-mono text-slate-500 hover:text-slate-300">
          Hide
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] text-slate-300">
          Selected Node: <span className="font-mono text-cyan-400 font-bold">{activeNode.id}</span>
        </div>

        {activeNode.type === 'Gate' && <>
          <label className="block space-y-1">Gate
            <select aria-label="Gate" className={fieldClass} value={activeNode.parameters.gate}
              onChange={e => {
                const parameters = defaultParameters(e.target.value);
                setWorkspaceState(nodes.map(node => node.id === activeNode.id ? { ...node, parameters } : node), edges);
              }}>
              {GATES.map(item => <option key={item.name} value={item.name}>{item.name.toUpperCase()}</option>)}
            </select>
          </label>
          {Array.from({ length: gate?.qubits || 1 }, (_, index) => (
            <label key={index} className="block space-y-1">
              {gate && gate.qubits > 1 && index < gate.qubits - 1 && gate.name !== 'swap' ? `Control ${index + 1}` : `Qubit ${index + 1}`} (zero-based)
              <input type="number" min={0} max={globalQubits - 1} className={fieldClass}
                value={activeNode.parameters.qubits?.[index] ?? ''}
                onChange={e => {
                  const operands = [...(activeNode.parameters.qubits || [])];
                  operands[index] = e.target.value === '' ? '' : Number(e.target.value);
                  updateParameterField('qubits', operands);
                }} />
            </label>
          ))}
          {gate?.rotation && <label className="block space-y-1">Angle (radians or pi/2)
            <input className={fieldClass} value={activeNode.parameters.angle ?? ''} onChange={e => updateParameterField('angle', e.target.value)} />
          </label>}
          {gate?.name === 'measure' && <label className="block space-y-1">Classical bit (zero-based)
            <input type="number" className={fieldClass} min={0} max={globalQubits - 1}
              value={activeNode.parameters.bit ?? ''} onChange={e => updateParameterField('bit', e.target.value === '' ? '' : Number(e.target.value))} />
          </label>}
        </>}
        {codeBlock && <>
          <label className="block space-y-1">Module name
            <input className={fieldClass} value={activeNode.parameters.name || ''} onChange={e => updateParameterField('name', e.target.value)} />
          </label>
          <label className="block space-y-1">OpenQASM source (global q/c registers)
            <textarea rows={8} spellCheck={false} className={`${fieldClass} select-text`} value={activeNode.parameters.source || ''}
              onChange={e => updateParameterField('source', e.target.value)} />
          </label>
          <p className="text-[10px] text-slate-500">Supported gates only; no Python, loops, reset, conditions, or gate declarations. Measurements must be last.</p>
          <button className="border border-cyan-800 rounded p-2 text-cyan-300" onClick={saveModule}>Save as reusable module</button>
          {moduleMessage && <p role="status" className="text-xs text-amber-300">{moduleMessage}</p>}
        </>}
        {!codeBlock && activeNode.type !== 'Gate' && <p className="text-[10px] text-amber-300">
          Blueprint only: this block has no quantum gate definition and cannot compile. Use gates, a module, or custom OpenQASM instead.
        </p>}
        {activeNode.type === 'QNN' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] text-slate-400 font-medium">Layer Count</label>
            <input
              type="number"
              min="1"
              max="64"
              value={activeNode.parameters?.layers || 4}
              onChange={(e) => updateParameterField('layers', parseInt(e.target.value) || 1)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
            />
          </div>
        )}

        {activeNode.type === 'QRAM' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] text-slate-400 font-medium">Address Mode</label>
            <select
              value={activeNode.parameters?.addressMode || 'Direct'}
              onChange={(e) => updateParameterField('addressMode', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-300 focus:outline-none"
            >
              <option value="Direct">Direct Register Index</option>
              <option value="BinaryTree">Binary Fanout Tree Schema</option>
              <option value="Superposition">Entangled Superposition Address</option>
            </select>
          </div>
        )}

        <div className="h-px bg-slate-900 w-full pt-1" />
        
        <button
          onClick={handleComponentPurge}
          className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900 text-rose-200 tracking-wide font-bold uppercase text-[10px] rounded transition-all"
        >
          🗑️ Disconnect & Remove Block
        </button>
      </div>
    </div>
  );
};
