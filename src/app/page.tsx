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
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">AI Agent Frameworks Landscape</h1>
      
      <div className="w-full max-w-6xl mb-6 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Search frameworks..."
            className="w-full p-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <select
            className="w-full p-2 border rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Agent Framework">Agent Frameworks</option>
            <option value="Orchestration">Orchestration Tools</option>
          </select>
        </div>
      </div>
      
      <div className="w-full max-w-6xl h-[600px]">
        <ScatterPlot frameworks={filteredFrameworks} />
      </div>
      
      <div className="mt-8 w-full max-w-6xl text-sm text-gray-500">
        <p>This visualization maps AI agent frameworks based on their required coding level and overall complexity.</p>
        <p className="mt-2">
          <strong>Code Level:</strong> 0 = No coding required, 1 = Advanced coding required
        </p>
        <p className="mt-1">
          <strong>Complexity:</strong> 0 = Simple to use, 1 = Complex with steep learning curve
        </p>
        <p className="mt-4 text-xs">
          Click on data points to view detailed information about each framework.
        </p>
      </div>
    </main>
  );
}