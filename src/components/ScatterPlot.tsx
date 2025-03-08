'use client';

import { useEffect, useState, useRef } from 'react';
import { AgentFramework } from '@/lib/data-parser';
import FrameworkDetails from './FrameworkDetails';
import dynamic from 'next/dynamic';

// Dynamically import chart.js components with no SSR
const ChartJSImports = dynamic(() => import('./ChartJSImports'), { ssr: false });
const Scatter = dynamic(() => import('react-chartjs-2').then(mod => mod.Scatter), { ssr: false });
// Import the browser's native Image constructor instead of Next.js Image component
// Custom plugin for rendering logos inside points
const logoImages: Record<string, HTMLImageElement> = {};

// Create SVG text for initials as a fallback with improved styling
const createSVGInitials = (name: string): string => {
  const initials = name.split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  
  // Color the initials based on the name to provide variety
  const colors = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
    '#007BFF', '#6610F2', '#6F42C1', '#E83E8C', // Bootstrap colors
    '#FF5722', '#009688', '#673AB7', '#3F51B5'  // Material colors
  ];
  
  // Use a hash function to consistently assign the same color to the same name
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % colors.length;
  const initialsColor = colors[colorIndex];
  
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="white" />
    <text x="16" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="${initialsColor}">${initials}</text>
  </svg>`;
};

// Create the logo plugin with a closure to capture the dark mode state
const createLogoPlugin = (isDarkMode: boolean) => ({
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
          
          // Draw background for the logo (white circle)
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Draw colored border with subtle glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
          ctx.lineWidth = 2;
          ctx.strokeStyle = isDarkMode ? 'rgba(150, 150, 255, 0.8)' : 'rgba(100, 100, 255, 0.8)';
          ctx.stroke();
          
          // Add subtle outer glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2 + 2, 0, 2 * Math.PI);
          ctx.lineWidth = 1;
          ctx.strokeStyle = isDarkMode ? 'rgba(150, 150, 255, 0.3)' : 'rgba(100, 100, 255, 0.3)';
          ctx.stroke();
          
          // Draw logo or initials
          const logo = logoImages[name];
          try {
            if (logo && logo.complete && logo.naturalHeight !== 0) {
              // Draw the logo with a circular mask
              ctx.save();
              ctx.beginPath();
              ctx.arc(point.x, point.y, size / 2 - 2, 0, 2 * Math.PI);
              ctx.closePath();
              ctx.clip();
              
              // Draw image with small margin for better appearance
              const margin = 4;
              ctx.drawImage(logo, x + margin/2, y + margin/2, size - margin, size - margin);
              ctx.restore();
            } else {
              // Fallback to drawing initials
              if (typeof window !== 'undefined') {
                const initialsSVG = new window.Image();
                initialsSVG.src = createSVGInitials(name);
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(point.x, point.y, size / 2 - 2, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(initialsSVG, x, y, size, size);
                ctx.restore();
              }
            }
          } catch (error) {
            // If there's any error drawing the logo, fall back to initials
            if (typeof window !== 'undefined') {
              const initialsSVG = new window.Image();
              initialsSVG.src = createSVGInitials(name);
              
              ctx.save();
              ctx.beginPath();
              ctx.arc(point.x, point.y, size / 2 - 2, 0, 2 * Math.PI);
              ctx.clip();
              ctx.drawImage(initialsSVG, x, y, size, size);
              ctx.restore();
            }
          }
        }
      });
    });
  }
});

// ChartJS components will be dynamically registered when component mounts
// This must happen before any chart is rendered!

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
        img.crossOrigin = 'anonymous'; // Allow cross-origin loading
        
        // Add error handling
        img.onerror = () => {
          console.warn(`Failed to load logo for ${framework.name}`);
          // Create a fallback initial image
          const fallbackImg = new window.Image();
          fallbackImg.src = createSVGInitials(framework.name);
          logoImages[framework.name] = fallbackImg;
        };
        
        img.src = framework.logo_url;
        logoImages[framework.name] = img;
      }
    });
    frameworksByName.current = lookupMap;

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
          label: 'AI Agent Tools',
          data: frameworks.map(framework => {
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
              category: framework.category, // Keep category for tooltip but don't filter by it
              url: framework.url,
              logo_url: framework.logo_url,
              // Store original values for tooltip
              originalX: framework.code_level,
              originalY: framework.complexity
            };
          }),
          backgroundColor: 'transparent', // Using transparent since we're rendering our own circles
          pointRadius: 18, // Slightly larger to make logos more visible
          pointHoverRadius: 22,
          pointStyle: 'circle',
          hitRadius: 30, // Increase hit area for better clickability
        }
      ],
    });
  }, [frameworks]);

  // Determine if we're in dark mode using state to make it reactive
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  
  // Register ChartJS components and plugins
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check initial dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDarkMode = darkModeQuery.matches;
    setPrefersDarkMode(isDarkMode);
    
    // Create the logo plugin with current dark mode
    const logoPluginInstance = createLogoPlugin(isDarkMode);
    
    // Import Chart.js - note we're not importing components here as they're already registered in ChartJSImports
    import('chart.js').then(({ Chart: ChartJS }) => {
      // Register logo plugin
      ChartJS.register(logoPluginInstance);
      
      // Add listener for changes in color scheme preference
      const darkModeListener = (e: MediaQueryListEvent) => {
        setPrefersDarkMode(e.matches);
        
        // Unregister old plugin and register new one with updated dark mode
        ChartJS.unregister(logoPluginInstance);
        const updatedLogoPlugin = createLogoPlugin(e.matches);
        ChartJS.register(updatedLogoPlugin);
        
        // Force chart update if we have a reference
        if (chartRef.current) {
          chartRef.current.update();
        }
      };
      
      darkModeQuery.addEventListener('change', darkModeListener);
      
      // Clean up
      return () => {
        darkModeQuery.removeEventListener('change', darkModeListener);
        ChartJS.unregister(logoPluginInstance);
      };
    });
  }, []);
  
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Code Level',
          padding: {top: 5, bottom: 5},
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
        },
        min: 0,
        max: 1,
        ticks: {
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Complexity',
          padding: {top: 5, bottom: 5},
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
        },
        min: 0,
        max: 1,
        ticks: {
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      tooltip: {
        backgroundColor: prefersDarkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 6,
        padding: 8,
        callbacks: {
          label: (context: any) => {
            const data = context.raw as any;
            // Use original values if available, otherwise use the displayed values
            const codeLevel = data.originalX !== undefined ? data.originalX : data.x;
            const complexity = data.originalY !== undefined ? data.originalY : data.y;
            return [
              `${data.name}`,
              `Type: ${data.category}`,
              `Code Level: ${codeLevel.toFixed(1)}`,
              `Complexity: ${complexity.toFixed(1)}`,
              `${data.description}`
            ];
          }
        }
      },
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          color: prefersDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 11
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.05
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
          scaleMode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
          threshold: 5
        },
        limits: {
          x: {min: -0.2, max: 1.2},
          y: {min: -0.2, max: 1.2}
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    onClick: (event: any, elements: any, chart: any) => {
      console.log("Chart clicked", event, elements);
      if (elements && elements.length > 0) {
        const { datasetIndex, index } = elements[0];
        
        if (chart && chart.data && chart.data.datasets) {
          const dataPoint = chart.data.datasets[datasetIndex].data[index];
          if (dataPoint && dataPoint.name) {
            console.log("Point clicked:", dataPoint.name);
            const framework = frameworksByName.current[dataPoint.name];
            
            if (framework) {
              console.log("Opening framework dialog:", framework.name);
              setSelectedFramework(framework);
              setDialogOpen(true);
            }
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

  // Make sure both ChartJS and chart data are loaded
  if (!chartData) return <div>Loading...</div>;
  
  return (
    <div className="w-full h-full">
      <div className="absolute top-14 right-4 z-10">
        <button 
          onClick={resetZoom}
          className="px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted rounded transition-colors shadow-md border border-border"
          title="Reset zoom level"
        >
          Reset View
        </button>
      </div>
      <div className="w-full h-full">
        {/* ChartJSImports must be included before any chart is rendered */}
        <ChartJSImports />
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>
      <FrameworkDetails 
        framework={selectedFramework} 
        open={dialogOpen} 
        onOpenChange={(open) => {
          console.log("Dialog open change:", open);
          setDialogOpen(open);
        }} 
      />
    </div>
  );
}