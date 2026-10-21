import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useGlobalQubitStore } from '../store/useGlobalQubitStore';
import { compileWorkspace } from '../services/compiler';
import { downloadText } from '../services/download';

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
    downloadText(JSON.stringify(payload, null, 2), `${workspaceName}.json`, 'application/json');
  };

  const handleExportQASM = () => {
    try {
      const { code } = compileWorkspace(nodes, edges, globalQubits, 'qasm');
      downloadText(code, `${workspaceName}.qasm`);
    } catch (error) {
      alert(`QASM export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return { handleNew, handleSave, handleLoad, handleExportJSON, handleExportQASM };
};
