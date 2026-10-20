import React from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../../store/useGlobalQubitStore';

interface CanvasViewportProps {
  onSelectNode: (id: string) => void;
  selectedNodeId: string | null;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({ onSelectNode, selectedNodeId }) => {
  const { nodes, workspaceName } = useWorkspaceStore();
  const { globalQubits } = useGlobalQubitStore();

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 graphical-viewport">
      {/* Interactive visual matrix lines aligned via app globals declaration */}
      <div className="absolute inset-0 pattern-grid opacity-40 pointer-events-none" />
      
      <div className="absolute inset-0 p-24 overflow-auto flex flex-wrap content-start gap-6 pt-28">
        {nodes.length === 0 ? (
          <div className="m-auto text-xs text-slate-600 font-sans italic p-8 border border-dashed border-slate-900 rounded-xl select-none text-center">
            Canvas Mesh Empty.<br />Select native primitives or community components from the Left library shelf to populate the workspace topology.
          </div>
        ) : (
          nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <div 
                key={node.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                className={`p-4 bg-slate-900 border rounded-xl w-56 text-left text-white shadow-2xl relative select-none cursor-pointer transition-all active:scale-[0.98] animate-fadeIn ${
                  isSelected 
                    ? 'border-cyan-400 ring-2 ring-cyan-950 ring-offset-2 ring-offset-slate-950 shadow-cyan-950/50' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Visual node selection indicator light port dots mapping */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
                )}

                <div className="text-[10px] font-bold text-cyan-400 font-sans tracking-wide uppercase mb-1">
                  {node.type === 'QNN' ? '🏺 QNN Layer Mold' : node.type === 'QRAM' ? '💾 QRAM Matrix Array' : '⨂ Custom QGate'}
                </div>
                <div className="text-[9px] font-mono text-slate-500 mb-2">ID: {node.id}</div>
                
                <div className="p-2 bg-slate-950 rounded border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                  <div>Inherited Wires: <span className="text-cyan-400 font-bold">N={globalQubits}</span></div>
                  {node.type === 'QNN' && <div>Layers Deep: <span className="text-emerald-400 font-bold">{node.parameters.layers || 4}</span></div>}
                  {node.type === 'QRAM' && <div>Address Mode: <span className="text-emerald-400 font-bold">{node.parameters.addressMode || 'Direct'}</span></div>}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-600 select-none">
        Target Space Layout: {workspaceName}.json
      </div>
    </div>
  );
};
