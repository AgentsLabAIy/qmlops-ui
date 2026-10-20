import { NextResponse } from 'next/server';

export async function GET() {
  // Mock dataset structured exactly to match your library definitions
  const mockCommunityLibrary = [
    {
      id: 'artifact_01',
      name: 'VQE-Optimizer-Chain',
      version: '1.2.0',
      icon: '🕸️'
    },
    {
      id: 'artifact_02',
      name: 'Quantum-Fourier-Transform',
      version: '2.0.4',
      icon: '📊'
    },
    {
      id: 'artifact_03',
      name: 'Shor-Ancilla-Array',
      version: '0.8.2',
      icon: '⛓️'
    }
  ];

  return NextResponse.json(mockCommunityLibrary);
}
