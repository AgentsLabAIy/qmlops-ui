import React from 'react';
import { useGlobalQubitStore } from '../../store/useGlobalQubitStore';

export const GlobalQubitCounter: React.FC = () => {
  const { globalQubits, setGlobalQubits } = useGlobalQubitStore();

  return (
    <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 select-none">
      <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wider uppercase">🌐 Global Qubits (N):</span>
      <input
        type="number"
        min="1"
        max="33"
        value={globalQubits}
        onChange={(e) => setGlobalQubits(parseInt(e.target.value) || 1)}
        className="w-12 bg-slate-900 text-cyan-400 font-mono text-center font-bold border-b border-cyan-900 focus:border-cyan-400 focus:outline-none transition-colors"
      />
    </div>
  );
};
