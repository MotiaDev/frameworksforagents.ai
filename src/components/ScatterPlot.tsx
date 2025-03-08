'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend,
  ChartOptions,
  zoom
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Scatter } from 'react-chartjs-2';
import { AgentFramework } from '@/lib/csv-parser';
import FrameworkDetails from './FrameworkDetails';
// Import the browser's native Image constructor instead of Next.js Image component
// Custom plugin for rendering logos inside points
const logoImages: Record<string, HTMLImageElement> = {};

// Create SVG text for initials as a fallback
const createSVGInitials = (name: string): string => {
  const initials = name.split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="white" />
    <text x="16" y="21" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle">${initials}</text>
  </svg>`;
};

const logoPlugin = {
  id: 'logoPlugin',
  beforeDraw: (chart: any) => {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      dataset.data.forEach((datapoint: any, index: number) => {
        const { name, logo_url } = datapoint;
        const point = meta.data[index];
        
        if (point && point.x !== undefined && point.y !== undefined) {
          const size = 28; // Size of logo circle
          const x = point.x - size / 2;
          const y = point.y - size / 2;
          
          // Draw point circle background
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = dataset.backgroundColor;
          ctx.fill();
          
          // Draw logo or initials
          const logo = logoImages[name];
          if (logo && logo.complete && logo.naturalHeight !== 0) {
            ctx.drawImage(logo, x, y, size, size);
          } else {
            // Fallback to drawing initials
            if (typeof window !== 'undefined') {
              const initialsSVG = new window.Image();
              initialsSVG.src = createSVGInitials(name);
              ctx.drawImage(initialsSVG, x, y, size, size);
            }
          }
        }
      });
    });
  }
};

// Register ChartJS components conditionally
if (typeof window !== 'undefined') {
  ChartJS.register(LinearScale, PointElement, Tooltip, Legend, logoPlugin, zoomPlugin);
}

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
      
      // Preload logo images for the chart plugin
      if (framework.logo_url && !logoImages[framework.name] && typeof window !== 'undefined') {
        const img = new window.Image();
        img.src = framework.logo_url;
        logoImages[framework.name] = img;
      }
    });
    frameworksByName.current = lookupMap;

    // Group frameworks by category
    const agentFrameworks = frameworks.filter(f => f.category === 'Agent Framework');
    const orchestrationTools = frameworks.filter(f => f.category === 'Orchestration');

    // Add a jitter function to slightly move overlapping points
    const addJitter = (value: number, amount: number = 0.02): number => {
      // Don't jitter if the value is 0 or 1, to maintain boundary points
      if (value === 0 || value === 1) return value;
      return value + (Math.random() - 0.5) * amount;
    };
    
    // Create a map to track positions and avoid overlaps
    const positionMap: Record<string, boolean> = {};
    
    setChartData({
      datasets: [
        {
          label: 'Agent Frameworks',
          data: agentFrameworks.map(framework => {
            // Create a unique position for each point
            let x = framework.code_level;
            let y = framework.complexity;
            const key = `${x.toFixed(2)},${y.toFixed(2)}`;
            
            // If this position is already taken, add jitter until we find a free spot
            if (positionMap[key]) {
              x = addJitter(x);
              y = addJitter(y);
              positionMap[`${x.toFixed(2)},${y.toFixed(2)}`] = true;
            } else {
              positionMap[key] = true;
            }
            
            return {
              x,
              y,
              name: framework.name,
              description: framework.description,
              url: framework.url,
              logo_url: framework.logo_url,
              // Store original values for tooltip
              originalX: framework.code_level,
              originalY: framework.complexity
            };
          }),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          pointRadius: 16, // Increased to make room for logos
          pointHoverRadius: 20,
          pointStyle: 'circle',
        },
        {
          label: 'Orchestration Tools',
          data: orchestrationTools.map(framework => {
            // Create a unique position for each point
            let x = framework.code_level;
            let y = framework.complexity;
            const key = `${x.toFixed(2)},${y.toFixed(2)}`;
            
            // If this position is already taken, add jitter until we find a free spot
            if (positionMap[key]) {
              x = addJitter(x);
              y = addJitter(y);
              positionMap[`${x.toFixed(2)},${y.toFixed(2)}`] = true;
            } else {
              positionMap[key] = true;
            }
            
            return {
              x,
              y,
              name: framework.name,
              description: framework.description,
              url: framework.url,
              logo_url: framework.logo_url,
              // Store original values for tooltip
              originalX: framework.code_level,
              originalY: framework.complexity
            };
          }),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          pointRadius: 16, // Increased to make room for logos
          pointHoverRadius: 20,
          pointStyle: 'circle',
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
            // Use original values if available, otherwise use the displayed values
            const codeLevel = data.originalX !== undefined ? data.originalX : data.x;
            const complexity = data.originalY !== undefined ? data.originalY : data.y;
            return [
              `${data.name}`,
              `Code Level: ${codeLevel.toFixed(1)}`,
              `Complexity: ${complexity.toFixed(1)}`,
              `${data.description}`
            ];
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy',
          scaleMode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
        limits: {
          x: {min: -0.2, max: 1.2},
          y: {min: -0.2, max: 1.2}
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

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  if (!chartData) return <div>Loading...</div>;

  return (
    <div className="w-full h-full p-4">
      <div className="flex justify-end mb-2">
        <button 
          onClick={resetZoom}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Reset Zoom
        </button>
      </div>
      <Scatter ref={chartRef} data={chartData} options={options} />
      <FrameworkDetails 
        framework={selectedFramework} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}