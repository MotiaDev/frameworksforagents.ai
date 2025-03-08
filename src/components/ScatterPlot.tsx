'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { AgentFramework } from '@/lib/csv-parser';
import FrameworkDetails from './FrameworkDetails';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface ScatterPlotProps {
  frameworks: AgentFramework[];
}

export default function ScatterPlot({ frameworks }: ScatterPlotProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedFramework, setSelectedFramework] = useState<AgentFramework | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const chartRef = useRef<any>(null);

  // Create lookup maps for efficiently finding frameworks by name
  const frameworksByName = useRef<Record<string, AgentFramework>>({});
  
  useEffect(() => {
    // Build lookup map
    const lookupMap: Record<string, AgentFramework> = {};
    frameworks.forEach(framework => {
      lookupMap[framework.name] = framework;
    });
    frameworksByName.current = lookupMap;

    // Group frameworks by category
    const agentFrameworks = frameworks.filter(f => f.category === 'Agent Framework');
    const orchestrationTools = frameworks.filter(f => f.category === 'Orchestration');

    setChartData({
      datasets: [
        {
          label: 'Agent Frameworks',
          data: agentFrameworks.map(framework => ({
            x: framework.code_level,
            y: framework.complexity,
            name: framework.name,
            description: framework.description,
            url: framework.url
          })),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          pointRadius: 8,
          pointHoverRadius: 10,
        },
        {
          label: 'Orchestration Tools',
          data: orchestrationTools.map(framework => ({
            x: framework.code_level,
            y: framework.complexity,
            name: framework.name,
            description: framework.description,
            url: framework.url
          })),
          backgroundColor: 'rgba(53, 162, 235, 0.6)',
          pointRadius: 8,
          pointHoverRadius: 10,
        },
      ],
    });
  }, [frameworks]);

  const options: ChartOptions<'scatter'> = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Code Level (0 = No Code, 1 = Advanced Coding)'
        },
        min: 0,
        max: 1
      },
      y: {
        title: {
          display: true,
          text: 'Complexity (0 = Simple, 1 = Complex)'
        },
        min: 0,
        max: 1
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw as any;
            return [
              `${data.name}`,
              `Code Level: ${data.x}`,
              `Complexity: ${data.y}`,
              `${data.description}`
            ];
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const { datasetIndex, index } = elements[0];
        const chart = chartRef.current;
        
        if (chart) {
          const dataPoint = chart.data.datasets[datasetIndex].data[index];
          const framework = frameworksByName.current[dataPoint.name];
          
          if (framework) {
            setSelectedFramework(framework);
            setDialogOpen(true);
          }
        }
      }
    }
  };

  if (!chartData) return <div>Loading...</div>;

  return (
    <div className="w-full h-full p-4">
      <Scatter ref={chartRef} data={chartData} options={options} />
      <FrameworkDetails 
        framework={selectedFramework} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}