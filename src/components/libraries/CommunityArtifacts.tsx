import React from 'react';

interface CommunityItem {
  id: string;
  name: string;
  version: string;
  icon: string;
}

interface CommunityArtifactsProps {
  items?: CommunityItem[]; // Made optional with '?' to handle missing parent bindings safely
}

export const CommunityArtifacts: React.FC<CommunityArtifactsProps> = ({ items = [] }) => {
  // Safe array normalizer: guarantees that safeItems is always an iterable array
  const safeItems = Array.isArray(items) ? items : [];

  const handleDragStart = (e: React.DragEvent, name: string, version: string) => {
    e.dataTransfer.setData('application/quantum-studio-type', name);
    e.dataTransfer.setData('application/quantum-studio-version', version);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-[10px] font-black text-cyan-500 font-sans uppercase tracking-widest px-1">▼ Quantum Library (Community)</h3>
      <div className="space-y-1.5 text-xs">
        {safeItems.length === 0 ? (
          <div className="p-3 text-[11px] text-slate-600 italic bg-slate-950/40 border border-slate-900 rounded font-sans">
            No published network topologies discovered in cluster tree registry.
          </div>
        ) : (
          safeItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.name, item.version)}
              className="p-2 bg-slate-950 border border-cyan-950 rounded flex justify-between items-center hover:border-cyan-800 cursor-grab active:cursor-grabbing transition-all"
            >
              <span className="text-slate-300 font-sans">{item.icon} {item.name}</span>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 rounded border border-slate-800">v{item.version}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
