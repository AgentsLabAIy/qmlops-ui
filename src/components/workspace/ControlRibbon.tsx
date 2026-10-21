import React from 'react';
import { Button } from '../ui/button';

interface ControlRibbonProps {
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExportJSON: () => void;
  onExportQASM: () => void;
  onPublish: () => void;
  onCompile: () => void;
}

export const ControlRibbon: React.FC<ControlRibbonProps> = ({
  onNew, onSave, onLoad, onExportJSON, onExportQASM, onPublish, onCompile
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 p-1.5 rounded-lg flex flex-wrap items-center gap-2 shadow-2xl">
      <Button onClick={onCompile} variant="accent">Compile</Button>
      <Button onClick={onNew}>📄 New</Button>
      <Button onClick={onLoad}>📂 Load</Button>
      <div className="h-4 w-px bg-slate-800" />
      <Button onClick={onSave}>💾 Save Local</Button>
      <Button onClick={onExportJSON} variant="secondary">📤 Export JSON</Button>
      <Button onClick={onExportQASM}>🧬 Export QASM</Button>
      <Button onClick={onPublish} variant="accent">🚀 Publish</Button>
    </div>
  );
};
