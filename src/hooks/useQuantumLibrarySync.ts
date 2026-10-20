import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export const useQuantumLibrarySync = (userId: string) => {
  const [communityItems, setCommunityItems] = useState([]);
  const { nodes, edges } = useWorkspaceStore();

  const fetchCommunityLibrary = async () => {
    const res = await fetch('/api/studio?action=fetch-community');
    const data = await res.json();
    if (data.community) setCommunityItems(data.community);
  };

  const handlePublish = async () => {
    const artifactName = prompt('Enter a distinct structural name identifier for your Quantum Library asset:');
    if (!artifactName) return;

    const res = await fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'publish',
        userId,
        payload: { name: artifactName, nodes, edges }
      })
    });
    const data = await res.json();
    alert(data.message || data.error);
    fetchCommunityLibrary();
  };

  useEffect(() => {
    fetchCommunityLibrary();
  }, []);

  return { communityItems, handlePublish };
};
