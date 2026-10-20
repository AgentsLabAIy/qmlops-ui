import React from 'react';
import { useWorkspaceStore, NodeData } from '../../store/useWorkspaceStore';

interface NodePortWriteProps {
  activeNode: NodeData | null;
  onClose: () => void;
}

export const NodePortWrite: React.FC<NodePortWriteProps> = ({ activeNode, onClose }) => {
  const { nodes, setWorkspaceState, edges } = useWorkspaceStore();

  if (!activeNode) return null;

  const updateSelectedParameter = (key: string, value: any) => {
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

  return (
    <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-3 font-sans select-none text-left">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          ⚙️ Properties Panel
        </span>
        <button onClick={onClose} className="text-[9px] font-mono text-slate-500 hover:text-slate-300">
          Hide
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] text-slate-300">
          Active ID: <span className="font-mono text-cyan-400 font-bold">{activeNode.id}</span>
        </div>

        {activeNode.type === 'QNN' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] text-slate-400 font-medium">Parametric Layer Depth Loop Counting</label>
            <input
              type="number"
              min="1"
              max="64"
              value={activeNode.parameters.layers || 4}
              onChange={(e) => updateSelectedParameter('layers', parseInt(e.target.value) || 1)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-700"
            />
          </div>
        )}

        {activeNode.type === 'QRAM' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] text-slate-400 font-medium">Memory Storage Address Encoding Mode</label>
            <select
              value={activeNode.parameters.addressMode || 'Direct'}
              onChange={(e) => updateSelectedParameter('addressMode', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-300 font-sans focus:outline-none focus:border-cyan-700"
            >
              <option value="Direct">Direct Register Index</option>
              <option value="BinaryTree">Binary Fanout Tree Schema</option>
              <option value="Superposition">Entangled Superposition Address</option>
            </select>
          </div>
        )}

        {activeNode.type !== 'QNN' && activeNode.type !== 'QRAM' && (
          <div className="text-[10px] text-slate-500 italic">
            This module inherits configuration dynamically from global system definitions.
          </div>
        )}
      </div>
    </div>
  );
};
