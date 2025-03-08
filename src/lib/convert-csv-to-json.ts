import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { AgentFramework } from './data-parser';

async function convertCsvToJson() {
  const csvPath = path.join(process.cwd(), 'public', 'agent_frameworks.csv');
  const jsonPath = path.join(process.cwd(), 'public', 'agent_frameworks.json');
  
  try {
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const { data } = Papa.parse<AgentFramework>(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    
    // Write to JSON file
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    
    console.log('Successfully converted CSV to JSON');
  } catch (error) {
    console.error('Error converting CSV to JSON:', error);
  }
}

// Run the conversion
convertCsvToJson();