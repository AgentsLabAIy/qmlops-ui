import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../../store/useGlobalQubitStore';
import { compileWorkspace, CompileLanguage } from '../../services/compiler';
import { SimulationResult } from '../../services/compiler/jsQuantumSimulator';
import type { SimulatorResponse } from '../../services/compiler/simulator.worker';
import { downloadText } from '../../services/download';

export const CompileDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { nodes, edges, workspaceName } = useWorkspaceStore();
  const { globalQubits } = useGlobalQubitStore();
  const [language, setLanguage] = useState<CompileLanguage>('qasm');
  const [compiled, setCompiled] = useState<ReturnType<typeof compileWorkspace> | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setCompiled(null);
    setSimulation(null);
    setError('');
    setBusy(false);
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, [nodes, edges, globalQubits, language]);

  const compile = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setError('');
    setCompiled(null);
    setSimulation(null);
    setBusy(true);
    try {
      const result = compileWorkspace(nodes, edges, globalQubits, language);
      setCompiled(result);
      const worker = new Worker(new URL('../../services/compiler/simulator.worker.ts', import.meta.url));
      workerRef.current = worker;
      const finish = () => {
        worker.terminate();
        workerRef.current = null;
        setBusy(false);
      };
      worker.onmessage = (event: MessageEvent<SimulatorResponse>) => {
        if (event.data.ok === true) setSimulation(event.data.result);
        else setError(`Simulation failed: ${event.data.error}`);
        finish();
      };
      worker.onerror = (event) => {
        setError(`Simulation worker failed: ${event.message || 'Unable to execute the circuit.'}`);
        finish();
      };
      worker.onmessageerror = () => {
        setError('Simulation worker returned an unreadable response.');
        finish();
      };
      worker.postMessage(result.circuit);
    } catch (cause) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setBusy(false);
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const completed = simulation?.status === 'completed' ? simulation : null;
  const outcomes = completed ? (completed.measurements.length ? completed.measurements : completed.basis) : [];
  const ranked = [...outcomes].sort((a, b) => b.probability - a.probability).slice(0, 64);

  return (
    <Dialog isOpen onClose={onClose} title="Compile and simulate" className="sm:max-w-3xl">
      <div className="space-y-4">
        <p>Choose a language. Generated code and browser simulation share the same validated circuit.
          Python is exported, not executed in the browser.</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="block">Output language</span>
            <select value={language} disabled={busy} onChange={event => {
              if (event.target.value === 'qasm' || event.target.value === 'qiskit') setLanguage(event.target.value);
            }} className="bg-slate-950 border border-slate-700 rounded p-2">
              <option value="qasm">OpenQASM 3</option>
              <option value="qiskit">Qiskit (Python)</option>
            </select>
          </label>
          <Button variant="accent" disabled={busy} onClick={compile}>{busy ? 'Simulating...' : 'Compile and simulate'}</Button>
          {compiled && <Button onClick={() => downloadText(compiled.code, `${workspaceName}.${compiled.language === 'qasm' ? 'qasm' : 'py'}`)}>Download code</Button>}
        </div>
        <p className="text-slate-500">Wires impose execution order; ready blocks use insertion order. Measurements must be terminal.
          Exact, noiseless state-vector simulation is limited to 16 qubits.</p>
        {error && <div role="alert" className="border border-rose-800 rounded p-3 text-rose-300 whitespace-pre-wrap">{error}</div>}
        {compiled && <section className="space-y-2">
          <h3 className="font-bold">Generated {compiled.language === 'qasm' ? 'OpenQASM 3' : 'Qiskit'} code ({compiled.circuit.instructions.length} operations)</h3>
          <pre tabIndex={0} aria-label="Generated code" className="max-h-72 overflow-auto bg-slate-950 border border-slate-800 rounded p-3 text-[11px] font-mono select-text">{compiled.code}</pre>
        </section>}
        {busy && <p role="status">Running jsQuantumSimulator in a background worker. Close this card to cancel.</p>}
        {simulation?.status === 'skipped' && <p role="status" className="text-amber-300">{simulation.message}</p>}
        {completed && <section className="space-y-2" aria-label="Simulation results">
          <h3 className="font-bold">Simulation complete</h3>
          <p>{completed.measurements.length ? 'Exact classical measurement probabilities (unmeasured bits remain 0).' : 'Computational-basis probabilities before measurement.'}
            {' '}Bitstrings are ordered highest index to lowest; q[0]/c[0] is rightmost. No shot sampling or hardware execution.</p>
          <p>{outcomes.length} nonzero outcomes. Showing the {Math.min(64, outcomes.length)} most probable.
            {' '}Total probability: {outcomes.reduce((sum, item) => sum + item.probability, 0).toFixed(8)}</p>
          <div className="max-h-48 overflow-auto">
            <table className="w-full font-mono text-xs">
              <thead><tr><th className="text-left">Bitstring</th><th className="text-right">Probability</th></tr></thead>
              <tbody>{ranked.map(item => <tr key={item.bits}>
                <td className="select-text">{item.bits}</td><td className="text-right">{(item.probability * 100).toFixed(6)}%</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>}
      </div>
    </Dialog>
  );
};
