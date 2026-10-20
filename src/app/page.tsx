'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeRouteRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Dynamically assign an ephemeral workspace profile signature slug on boot up
    const dynamicSeed = Math.floor(100000 + Math.random() * 900000);
    const calculatedTargetUser = `researcher_${dynamicSeed}`;
    router.replace(`/studio/${calculatedTargetUser}`);
  }, [router]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 font-sans">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-xs font-mono text-slate-400 tracking-wider">
        Initializing Quantum MLOps Studio Runtime Sandbox Space...
      </div>
    </div>
  );
}
