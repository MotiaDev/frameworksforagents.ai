import Papa from 'papaparse';

export interface AgentFramework {
  name: string;
  category: string;
  description: string;
  website_url?: string;
  github_url?: string;
  docs_url?: string;
  community_url?: string;
  license?: string;
  logo_url: string;
  programming_language?: string[];
  programming_language_support?: number;
  communication_protocols?: string[];
  code_level: number;
  code_level_justification: string;
  complexity: number;
  complexity_justification: string;
  user_interface_availability?: boolean;
  scalability?: number;
  scalability_justification?: string;
  integration_score?: number;
  integration_score_justification?: string;
  learning_curve?: number;
  learning_curve_justification?: string;
  update_frequency_and_maintenance?: boolean;
  deployment_platform?: string | string[];
  use_cases_and_applications?: string;
  observability?: number;
  observability_justification?: string;
  
  // For backwards compatibility
  url?: string;
}

export async function parseAgentFrameworksFromCSV(): Promise<AgentFramework[]> {
  const response = await fetch('/agent_frameworks.csv');
  const csvText = await response.text();
  
  const { data } = Papa.parse<AgentFramework>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  
  return data;
}

export async function parseAgentFrameworks(): Promise<AgentFramework[]> {
  const response = await fetch('/agent_frameworks.json');
  const data = await response.json();
  return data as AgentFramework[];
}