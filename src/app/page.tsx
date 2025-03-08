'use client';

import { useEffect, useState } from 'react';
import ScatterPlot from '@/components/ScatterPlot';
import { AgentFramework, parseAgentFrameworks } from '@/lib/csv-parser';

export default function Home() {
  const [frameworks, setFrameworks] = useState<AgentFramework[]>([]);
  const [filteredFrameworks, setFilteredFrameworks] = useState<AgentFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredFrameworks(filtered);
  }, [frameworks, categoryFilter, searchQuery]);

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
      {/* Fixed top navigation bar */}
      <div className="w-full bg-white shadow-md fixed top-0 z-10 px-4 py-3">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">AI Agent Frameworks Landscape</h1>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:items-center">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search frameworks..."
                className="w-full p-2 border rounded-md text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Agent Framework">Agent Frameworks</option>
                <option value="Orchestration">Orchestration Tools</option>
              </select>
            </div>
            
            {/* Add a legend for the chart */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span>Code Level: 0 = No Code, 1 = Advanced</span>
              <span className="mx-2">|</span>
              <span>Complexity: 0 = Simple, 1 = Complex</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full-screen chart area */}
      <div className="w-full h-screen pt-16">
        <ScatterPlot frameworks={filteredFrameworks} />
      </div>
    </main>
  );
}