import React from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface CommunityArtifactsProps {
  items: Array<{ id: string; name: string; version: string; icon: string }>;
}

export const CommunityArtifacts: React.FC<CommunityArtifactsProps> = ({ items }) => {
  const { addNode } = useWorkspaceStore();

  const spawnCommunityNode = (item: any) => {
    addNode({
      id: `shared_${item.id}_${Date.now()}`,
      type: item.name.split(' ')[0],
      position: { x: 200, y: 200 },
      parameters: { versionRef: item.version }
    });
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-[10px] font-black text-cyan-500 font-sans uppercase tracking-widest px-1">▼ Quantum Library (Community)</h3>
      <div className="space-y-1.5 text-xs">
        {items.length === 0 ? (
          <div className="p-3 text-[11px] text-slate-600 italic bg-slate-950/40 border border-slate-900 rounded font-sans">
            No published network topologies discovered in cluster tree registry.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => spawnCommunityNode(item)}
              className="p-2 bg-slate-950 border border-cyan-950 rounded flex justify-between items-center hover:border-cyan-800 cursor-pointer active:scale-[0.99] transition-all"
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
