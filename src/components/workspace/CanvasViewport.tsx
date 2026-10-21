import React, { useState, useRef } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../../store/useGlobalQubitStore';
import { createWorkspaceNode } from '../../services/compiler/circuit';

interface CanvasViewportProps {
  onSelectNode: (id: string | null) => void;
  selectedNodeId: string | null;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({ onSelectNode, selectedNodeId }) => {
  const { nodes, workspaceName, addNode, updateNodePosition, edges, addEdge, moduleTemplates } = useWorkspaceStore();
  const { globalQubits } = useGlobalQubitStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // States to manage live cursor coordinate wire tracing
  const [wireSourceNodeId, setWireSourceNodeId] = useState<string | null>(null);
  const [liveCursorCoords, setLiveCursorCoords] = useState<{ x: number; y: number } | null>(null);
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const nodeType = e.dataTransfer.getData('application/quantum-studio-type');
    if (!nodeType) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPosition = e.clientX - rect.left - 112; 
    const yPosition = e.clientY - rect.top - 45;

    const node = createWorkspaceNode(nodeType, { x: xPosition, y: yPosition });
    const templateId = e.dataTransfer.getData('application/quantum-studio-template');
    if (templateId) {
      const template = moduleTemplates.find(item => item.id === templateId);
      if (!template) {
        alert('This module template is no longer available. Drag it again from the library.');
        return;
      }
      node.parameters = { name: template.name, source: template.source };
    }
    addNode(node);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string, currentPos: { x: number; y: number }) => {
    if ((e.target as HTMLElement).closest('.port-wire-handle')) return;
    
    setDraggingNodeId(id);
    setDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    });
    onSelectNode(id);
  };

  // --- INTERACTIVE MOUSE TRACKER FOR BOTH CARD MOVING & WIRE DRAWING ---
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Context A: User is dragging an active block around the mesh
    if (draggingNodeId) {
      let targetX = e.clientX - dragOffset.x;
      let targetY = e.clientY - dragOffset.y;
      updateNodePosition(draggingNodeId, targetX, targetY);
      return;
    }

    // Context B: User is dragging a connection wire thread across the screen
    if (wireSourceNodeId) {
      setLiveCursorCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Clean up states when mouse click lifts on open canvas grid space
  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
    setWireSourceNodeId(null);
    setLiveCursorCoords(null);
  };

  // --- DRAG-TO-WIRE EVENT HANDLERS ---
  const handleWireDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Block native window ghost text dragging
    setWireSourceNodeId(nodeId);
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLiveCursorCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleWireDragDropTarget = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (wireSourceNodeId && wireSourceNodeId !== targetNodeId) {
      addEdge(wireSourceNodeId, targetNodeId);
    }
    // Clean assembly states post-connection link drop
    setWireSourceNodeId(null);
    setLiveCursorCoords(null);
  };

  return (
    <div 
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDropCanvas}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={() => { setWireSourceNodeId(null); setLiveCursorCoords(null); onSelectNode(null); }}
      className="w-full h-full relative overflow-hidden bg-slate-950 graphical-viewport cursor-default"
    >
      <div className="absolute inset-0 pattern-grid opacity-40 pointer-events-none" />

      {/* --- CONNECTIONS SVG VECTOR MESH --- */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Render fully committed node-to-node circuit edges */}
        {edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);

          if (!sourceNode || !targetNode) return null;

          const startX = sourceNode.position.x + 112; 
          const startY = sourceNode.position.y + 100; 
          const endX = targetNode.position.x + 112;
          const endY = targetNode.position.y;

          const controlY = startY + (endY - startY) / 2;
          const dCurvePath = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;

          return (
            <g key={edge.id}>
              <path d={dCurvePath} className="stroke-cyan-500/80 stroke-2 fill-none animate-pulse" />
              <circle cx={startX} cy={startY} r="3" className="fill-cyan-400" />
              <circle cx={endX} cy={endY} r="3" className="fill-cyan-400" />
            </g>
          );
        })}

        {/* LIVE IN-FLIGHT CURRENT WIRE THREAD DRAW LAYER */}
        {wireSourceNodeId && liveCursorCoords && (() => {
          const activeSourceNode = nodes.find(n => n.id === wireSourceNodeId);
          if (!activeSourceNode) return null;

          const sX = activeSourceNode.position.x + 112;
          const sY = activeSourceNode.position.y + 100;
          const eX = liveCursorCoords.x;
          const eY = liveCursorCoords.y;

          const ctrlY = sY + (eY - sY) / 2;
          const dragCurve = `M ${sX} ${sY} C ${sX} ${ctrlY}, ${eX} ${ctrlY}, ${eX} ${eY}`;

          return (
            <g>
              <path d={dragCurve} className="stroke-cyan-400/90 stroke-2 stroke-dashed fill-none" strokeDasharray="4,4" />
              <circle cx={sX} cy={sY} r="4" className="fill-cyan-400 animate-ping" />
              <circle cx={eX} cy={eY} r="3" className="fill-cyan-400" />
            </g>
          );
        })()}
      </svg>

      {/* --- NODES CORE LAYOUT CONTAINER --- */}
      <div className="absolute inset-0 pointer-events-none z-10 p-4">
        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const isCurrentSource = node.id === wireSourceNodeId;
          
          return (
            <div 
              key={node.id} 
              onMouseDown={(e) => handleNodeMouseDown(e, node.id, node.position)}
              onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); }}
              style={{ transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0px)`, position: 'absolute' }}
              className={`p-4 bg-slate-900 border rounded-xl w-56 text-left text-white shadow-2xl select-none pointer-events-auto cursor-grab active:cursor-grabbing ${
                isSelected ? 'border-cyan-400 ring-2 ring-cyan-950' : 'border-slate-800'
              }`}
            >
              {/* TOP RECEIVING PORT: Mouse release loop triggers link binding */}
              <div 
                onMouseUp={(e) => handleWireDragDropTarget(e, node.id)}
                className={`port-wire-handle absolute -top-1.5 left-[106px] w-3 h-3 rounded-full border-2 border-slate-950 bg-slate-800 cursor-pointer hover:bg-emerald-400 hover:scale-125 transition-all ${
                  wireSourceNodeId && !isCurrentSource ? 'animate-pulse bg-emerald-500/80 border-emerald-400' : ''
                }`}
                title="Drop connecting wire thread anchor pin"
              />

              <div className="text-[10px] font-bold text-cyan-400 font-sans tracking-wide uppercase mb-1">
                {node.type === 'Gate' ? node.parameters.gate : node.parameters.name || node.type}
              </div>
              <div className="text-[9px] font-mono text-slate-500 mb-2">ID: {node.id}</div>
              
              <div className="p-2 bg-slate-950 rounded border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                <div>Global Qubits: <span className="text-cyan-400 font-bold">{globalQubits}</span></div>
                {node.type === 'Gate' && <div>Operands: q[{node.parameters.qubits?.join('], q[')}]</div>}
                {node.type === 'Gate' && node.parameters.angle !== undefined && <div>Angle: {node.parameters.angle}</div>}
                {node.type === 'QNN' && <div>Layers: <span className="text-emerald-400 font-bold">{node.parameters?.layers || 4}</span></div>}
                {node.type === 'QRAM' && <div>Mode: <span className="text-emerald-400 font-bold">{node.parameters?.addressMode || 'Direct'}</span></div>}
              </div>

              {/* BOTTOM DISPATCH PORT: Press mouse down here and hold to drag cable out */}
              <div 
                onMouseDown={(e) => handleWireDragStart(e, node.id)}
                className={`port-wire-handle absolute -bottom-1.5 left-[106px] w-3 h-3 rounded-full border-2 border-slate-950 bg-slate-800 cursor-pointer hover:bg-cyan-400 hover:scale-125 transition-all ${
                  isCurrentSource ? 'bg-cyan-400 ring-2 ring-cyan-950 scale-110' : ''
                }`}
                title="Click and drag cable to connect blocks"
              />
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-2 left-3 text-[10px] text-slate-500 pointer-events-none">
        {workspaceName}: wires set execution order; unwired blocks use insertion order.
      </div>
    </div>
  );
};
