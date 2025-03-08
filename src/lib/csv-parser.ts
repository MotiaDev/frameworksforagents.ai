import Papa from 'papaparse';

export interface AgentFramework {
  name: string;
  category: string;
  code_level: number;
  code_level_justification: string;
  complexity: number;
  complexity_justification: string;
  description: string;
  url: string;
}

export async function parseAgentFrameworks(): Promise<AgentFramework[]> {
  const response = await fetch('/agent_frameworks.csv');
  const csvText = await response.text();
  
  const { data } = Papa.parse<AgentFramework>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  
  return data;
}