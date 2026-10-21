import { create } from 'zustand';

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
}

export interface EdgeData {
  id: string;
  source: string; // Tail origin node block ID
  target: string; // Head destination node block ID
}

export interface ModuleTemplate {
  id: string;
  name: string;
  source: string;
}

interface WorkspaceState {
  workspaceName: string;
  nodes: NodeData[];
  edges: EdgeData[]; // Stores layout thread wiring lines
  setWorkspaceName: (name: string) => void;
  setWorkspaceState: (nodes: NodeData[], edges: EdgeData[]) => void;
  clearWorkspace: () => void;
  addNode: (node: NodeData) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  removeNode: (id: string) => void;
  moduleTemplates: ModuleTemplate[];
  addModuleTemplate: (template: ModuleTemplate) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaceName: 'untitled_pipeline',
  nodes: [],
  edges: [],
  moduleTemplates: [],
  addModuleTemplate: (template) => set((state) => ({ moduleTemplates: [...state.moduleTemplates, template] })),
  setWorkspaceName: (name) => set({ workspaceName: name }),
  setWorkspaceState: (nodes, edges) => set({ nodes, edges }),
  clearWorkspace: () => set({ nodes: [], edges: [], workspaceName: 'untitled_pipeline' }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNodePosition: (id, x, y) => set((state) => ({
    nodes: state.nodes.map((node) => node.id === id ? { ...node, position: { x, y } } : node)
  })),

  addEdge: (sourceId, targetId) => set((state) => {
    if (sourceId === targetId) return state; // Block loopbacks
    const linkExists = state.edges.some(e => e.source === sourceId && e.target === targetId);
    if (linkExists) return state; // Block duplicate wires

    const newEdge: EdgeData = {
      id: `edge_${sourceId}_to_${targetId}`,
      source: sourceId,
      target: targetId,
    };
    return { edges: [...state.edges, newEdge] };
  }),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    // Cascade drop any active wire paths connected to this element
    edges: state.edges.filter(e => e.source !== id && e.target !== id)
  }))
}));
