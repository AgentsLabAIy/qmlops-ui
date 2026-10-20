import React from 'react';
import { useWorkspaceStore, NodeData } from '../../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../../store/useGlobalQubitStore';

export const CanvasViewport: React.FC = () => {
  const { nodes, workspaceName } = useWorkspaceStore();
  const { globalQubits } = useGlobalQubitStore();

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 graphical-viewport">
      {/* Mock Grid Background Matrix Lines Mapping React Flow Emulation */}
      <div className="absolute inset-0 pattern-grid opacity-[0.03]" />
      
      <div className="absolute inset-0 p-24 overflow-auto flex flex-wrap content-start gap-6 pt-28">
        {nodes.length === 0 ? (
          <div className="m-auto text-xs text-slate-600 font-sans italic p-8 border border-dashed border-slate-900 rounded-xl select-none text-center">
            Canvas Mesh Empty.<br />Select native primitives or community components from the Left library shelf to populate the workspace topology.
          </div>
        ) : (
          nodes.map((node) => (
            <div key={node.id} className="p-4 bg-slate-900 border border-slate-800 hover:border-cyan-800 rounded-xl w-56 text-left text-white shadow-2xl relative select-none animate-fadeIn">
              <div className="text-[10px] font-bold text-cyan-400 font-sans tracking-wide uppercase mb-1">
                {node.type === 'QNN' ? '🏺 QNN Layer Mold' : node.type === 'QRAM' ? '💾 QRAM Matrix Array' : '⨂ Custom QGate'}
              </div>
              <div className="text-[9px] font-mono text-slate-500 mb-2">ID: {node.id}</div>
              <div className="p-2 bg-slate-950 rounded border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                <div>Inherited Wires: <span className="text-cyan-400 font-bold">N={globalQubits}</span></div>
                {node.type === 'QNN' && <div>Layers Deep: {node.parameters.layers || 4}</div>}
                {node.type === 'QRAM' && <div>Address Mode: {node.parameters.addressMode || 'Direct'}</div>}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-600 select-none">
        Target Space Layout: {workspaceName}.json
      </div>
    </div>
  );
};
