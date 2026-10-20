import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../store/useGlobalQubitStore';
import { compileToQASM } from '../services/quantumLayerStub';

export const useWorkspaceActions = (userId: string) => {
  const { nodes, edges, workspaceName, clearWorkspace, setWorkspaceState, setWorkspaceName } = useWorkspaceStore();
  const { globalQubits, setGlobalQubits } = useGlobalQubitStore();

  const handleNew = () => {
    if (confirm('Initialize fresh canvas? Unsaved layout state changes will be dropped.')) {
      clearWorkspace();
      setGlobalQubits(8);
    }
  };

  const handleSave = async () => {
    const res = await fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        userId,
        payload: { nodes, edges, globalQubits, workspaceName }
      })
    });
    const data = await res.json();
    alert(data.message || data.error);
  };

  const handleLoad = async () => {
    const res = await fetch(`/api/studio?action=load&userId=${userId}`);
    const data = await res.json();
    setWorkspaceState(data.nodes || [], data.edges || []);
    setGlobalQubits(data.global_qubit_count || 8);
    setWorkspaceName(data.workspaceName || 'untitled_pipeline');
    alert('Workspace pipeline context rehydrated from endpoint runtime schema.');
  };

  const handleExportJSON = () => {
    const payload = { workspaceName, globalQubits, nodes, edges };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${workspaceName}.json`;
    link.click();
  };

  const handleExportQASM = () => {
    const standardPayload = nodes.map(n => ({ id: n.id, type: n.type, globalQubitCount: globalQubits, parameters: n.parameters }));
    const qasmText = compileToQASM(standardPayload, globalQubits);
    const blob = new Blob([qasmText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${workspaceName}.qasm`;
    link.click();
  };

  return { handleNew, handleSave, handleLoad, handleExportJSON, handleExportQASM };
};
