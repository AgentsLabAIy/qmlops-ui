import { useEffect, useState } from 'react';

interface CommunityItem {
  id: string;
  name: string;
  version: string;
  icon: string;
}

export const useQuantumLibrarySync = (userId: string = 'default_user') => {
  // Named exactly communityItems to align seamlessly with your page variable configuration
  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunityLibrary = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/community-library'); 
        
        if (!response.ok) {
          throw new Error(`Server returned status code: ${response.status}`);
        }
        
        const data = await response.json();
        setCommunityItems(data);
      } catch (err: any) {
        console.warn('Backend API unreachable. Falling back to clean local state arrays:', err.message);
        setCommunityItems([]); 
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityLibrary();
  }, [userId]);

  // Mock handler placeholder matching the save trigger on your control ribbon panel
  const handlePublish = async () => {
    console.log(`Publishing workspace pipeline assets configuration for user: ${userId}`);
  };

  return { communityItems, handlePublish, loading, error };
};
