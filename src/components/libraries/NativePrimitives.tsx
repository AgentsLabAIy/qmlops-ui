import React from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const NativePrimitives: React.FC = () => {
  const { addNode } = useWorkspaceStore();

  const spawnPrimitiveNode = (type: string, name: string) => {
    addNode({
      id: `${type.toLowerCase()}_${Date.now()}`,
      type,
      position: { x: 100 + Math.random() * 80, y: 150 + Math.random() * 80 },
      parameters: type === 'QNN' ? { layers: 4 } : { addressMode: 'Direct' }
    });
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-[10px] font-black text-slate-500 font-sans uppercase tracking-widest px-1">▼ Native Primitives</h3>
      <div className="space-y-1.5 text-xs">
        <div onClick={() => spawnPrimitiveNode('CustomGate', 'Custom QGate Block')} className="p-2 bg-slate-950 border border-slate-800 rounded font-sans text-slate-300 hover:border-slate-700 cursor-pointer active:scale-[0.99] transition-all">
          [⨂] Custom QGate Block
        </div>
        <div onClick={() => spawnPrimitiveNode('QNN', 'QNN Layer Mold')} className="p-2 bg-slate-950 border border-slate-800 rounded font-sans text-slate-300 hover:border-slate-700 cursor-pointer active:scale-[0.99] transition-all">
          [🏺] QNN Layer Mold
        </div>
        <div onClick={() => spawnPrimitiveNode('QRAM', 'QRAM Matrix Array')} className="p-2 bg-slate-950 border border-slate-800 rounded font-sans text-slate-300 hover:border-slate-700 cursor-pointer active:scale-[0.99] transition-all">
          [💾] QRAM Matrix Array
        </div>
      </div>
    </div>
  );
};
