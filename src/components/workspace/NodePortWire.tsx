import React from 'react';
import { useWorkspaceStore, NodeData } from '../../store/useWorkspaceStore';

interface NodePortWireProps {
  activeNode: NodeData | null;
  onClose: () => void;
}

// Named exactly NodePortWrite to fix your Next.js import tracking compilation error
export const NodePortWrite: React.FC<NodePortWireProps> = ({ activeNode, onClose }) => {
  const { nodes, setWorkspaceState, edges, removeNode } = useWorkspaceStore();

  if (!activeNode) return null;

  const updateParameterField = (key: string, value: any) => {
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

  const handleComponentPurge = () => {
    removeNode(activeNode.id);
    onClose();
  };

  return (
    <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-4 font-sans text-left">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          ⚙️ Block Wire Properties
        </span>
        <button onClick={onClose} className="text-[9px] font-mono text-slate-500 hover:text-slate-300">
          Hide
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] text-slate-300">
          Selected Node: <span className="font-mono text-cyan-400 font-bold">{activeNode.id}</span>
        </div>

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
