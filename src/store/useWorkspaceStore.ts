import { create } from 'zustand';

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface WorkspaceState {
  workspaceName: string;
  nodes: NodeData[];
  edges: EdgeData[];
  setWorkspaceName: (name: string) => void;
  setWorkspaceState: (nodes: NodeData[], edges: EdgeData[]) => void;
  clearWorkspace: () => void;
  addNode: (node: NodeData) => void;
  addEdge: (edge: EdgeData) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaceName: 'untitled_pipeline',
  nodes: [],
  edges: [],
  setWorkspaceName: (name) => set({ workspaceName: name }),
  setWorkspaceState: (nodes, edges) => set({ nodes, edges }),
  clearWorkspace: () => set({ nodes: [], edges: [], workspaceName: 'untitled_pipeline' }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
}));
