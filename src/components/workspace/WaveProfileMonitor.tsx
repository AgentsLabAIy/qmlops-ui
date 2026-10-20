import React, { useMemo } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const WaveProfileMonitor: React.FC = () => {
  const { nodes } = useWorkspaceStore();

  // Compute a deterministic step configuration visualization to mock live telemetry
  const dummyWavePaths = useMemo(() => {
    if (nodes.length === 0) return '';
    return nodes.map((_, index) => {
      const xStep = index * 40 + 10;
      const yAmplitude = 25 + Math.sin(index * 1.8) * 18;
      return `${index === 0 ? 'M' : 'L'} ${xStep} ${yAmplitude}`;
    }).join(' ');
  }, [nodes]);

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 select-none text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-sans">
            📊 Emulated Telemetry Monitor
          </span>
        </div>
        <span className="text-[9px] font-mono text-emerald-500 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded">
          Active Vector
        </span>
      </div>

      <div className="h-16 w-full bg-slate-900/60 border border-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
        {nodes.length === 0 ? (
          <span className="text-[10px] text-slate-600 font-sans italic">
            Awaiting live node mapping configuration state vector input...
          </span>
        ) : (
          <svg className="w-full h-full stroke-cyan-500 fill-none stroke-[1.5]" viewBox="0 0 200 50" preserveAspectRatio="none">
            {/* Display static guide line markers */}
            <line x1="0" y1="25" x2="200" y2="25" className="stroke-slate-800 stroke-dasharray-[2,2] stroke-[1]" />
            {/* Draw live responsive dynamic wire mock stream path updates */}
            <path d={dummyWavePaths} className="transition-all duration-500 ease-in-out" />
          </svg>
        )}
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 px-0.5">
        <span>State Resolution: 2^{nodes.length} states</span>
        <span>Coherence Error Margin: 0.0034%</span>
      </div>
    </div>
  );
};
