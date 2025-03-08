'use client';

import { useEffect, useState } from 'react';
import ScatterPlot from '@/components/ScatterPlot';
import { AgentFramework, parseAgentFrameworks } from '@/lib/csv-parser';

export default function Home() {
  const [frameworks, setFrameworks] = useState<AgentFramework[]>([]);
  const [filteredFrameworks, setFilteredFrameworks] = useState<AgentFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await parseAgentFrameworks();
        setFrameworks(data);
        setFilteredFrameworks(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
        console.error('Error loading CSV data:', err);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...frameworks];
    
    // Apply search filter only
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.description.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredFrameworks(filtered);
  }, [frameworks, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-0">
      {/* Fixed top navigation bar - always dark */}
      <div className="w-full bg-card shadow-md fixed top-0 z-10 px-4 py-2">
        <div className="container mx-auto flex flex-row items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-foreground shrink-0">AI Agent Landscape</h1>
          
          <div className="flex flex-row items-center gap-2">
            <div className="w-48 sm:w-64">
              <input
                type="text"
                placeholder="Search frameworks..."
                className="w-full p-1.5 border rounded text-sm bg-input text-foreground border-border placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Compact legend */}
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              <span title="0 = No Code, 1 = Advanced">Code Level</span>
              <span className="mx-1">|</span>
              <span title="0 = Simple, 1 = Complex">Complexity</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full-screen chart area - reduced top padding */}
      <div className="w-full h-screen pt-12">
        <ScatterPlot frameworks={filteredFrameworks} />
      </div>
    </main>
  );
}