'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { GlobalQubitCounter } from '../../../components/ui/global-qubit-counter';
import { NativePrimitives } from '../../../components/libraries/NativePrimitives';
import { CommunityArtifacts } from '../../../components/libraries/CommunityArtifacts';
import { ControlRibbon } from '../../../components/workspace/ControlRibbon';
import { CanvasViewport } from '../../../components/workspace/CanvasViewport';
import { useWorkspaceActions } from '../../../hooks/useWorkspaceActions';
import { useQuantumLibrarySync } from '../../../hooks/useQuantumLibrarySync';

export default function StudioDashboardSandbox() {
  const params = useParams();
  const userId = (params?.userId as string) || 'default_user';

  // Ingest lifecycle custom logic hooks
  const { handleNew, handleSave, handleLoad, handleExportJSON, handleExportQASM } = useWorkspaceActions(userId);
  const { communityItems, handlePublish } = useQuantumLibrarySync(userId);

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden antialiased">
      
      {/* --- TOP MATRIX GLOBAL HEADER BAR --- */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4 shadow-md z-30">
        <div className="flex items-center space-x-3 select-none">
          <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">⚛️ Quantum MLOps Studio</span>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            User Context: {userId}
          </span>
        </div>
        <GlobalQubitCounter />
      </header>

      {/* --- TRI-PANE INTEGRATED CORE WORKSPACE SPACE --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COMPONENT AND LIBRARY PANELS */}
        <aside className="w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-6 overflow-y-auto z-20 shadow-lg">
          <NativePrimitives />
          <div className="h-px bg-slate-800 w-full" />
          <CommunityArtifacts items={communityItems} />
        </aside>

        {/* CENTER INTERACTIVE FLOW EDITING VIEWPORT CANVAS */}
        <main className="flex-1 h-full relative z-10">
          <ControlRibbon
            onNew={handleNew}
            onSave={handleSave}
            onLoad={handleLoad}
            onExportJSON={handleExportJSON}
            onExportQASM={handleExportQASM}
            onPublish={handlePublish}
          />
          <CanvasViewport />
        </main>
        
      </div>

      {/* FOOTER PIPELINE TRACKER */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-1.5 text-[9px] text-slate-500 flex justify-between select-none z-30 font-mono">
        <span>Quantum Compiler Core: Connected</span>
        <span>Simulation Runtime Protocol: Local Hardware State-Vector Emulation (Isolated)</span>
      </footer>
    </div>
  );
}
