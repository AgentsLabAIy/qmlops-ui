import React from 'react';

export const NativePrimitives: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/quantum-studio-type', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-[10px] font-black text-slate-500 font-sans uppercase tracking-widest px-1">▼ Native Primitives</h3>
      <div className="space-y-1.5 text-xs">
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, 'CustomGate')}
          className="p-2 bg-slate-950 border border-slate-800 rounded font-sans text-slate-300 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all"
        >
          [⨂] Custom QGate Block
        </div>
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, 'QNN')}
          className="p-2 bg-slate-950 border border-slate-800 rounded font-sans text-slate-300 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all"
        >
          [🏺] QNN Layer Mold
        </div>
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, 'QRAM')}
          className="p-2 bg-slate-950 border border-slate-800 rounded font-sans text-slate-300 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all"
        >
          [💾] QRAM Matrix Array
        </div>
      </div>
    </div>
  );
};
