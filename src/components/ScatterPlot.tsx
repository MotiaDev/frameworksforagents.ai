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
          const size = 32; // Keep this consistent with hit detection radius (16px radius = 32px diameter)
          const x = point.x - size / 2;
          const y = point.y - size / 2;
          
          // Draw background for the logo (white circle)
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Generate a consistent color for this framework
          const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const colors = [
            '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
            '#007BFF', '#6610F2', '#6F42C1', '#E83E8C', // Bootstrap colors
            '#FF5722', '#009688', '#673AB7', '#3F51B5'  // Material colors
          ];
          const colorIndex = nameHash % colors.length;
          const borderColor = colors[colorIndex];
          
          // Draw colored border with subtle glow - unique color per framework
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
          ctx.lineWidth = 2;
          ctx.strokeStyle = borderColor;
          ctx.stroke();
          
          // Add subtle outer glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2 + 2, 0, 2 * Math.PI);
          ctx.lineWidth = 1;
          ctx.strokeStyle = borderColor.replace(')', ', 0.3)').replace('rgb', 'rgba');
          ctx.stroke();
          
          // Draw tiny name label below the icon for better identification
          if (chart.getZoomLevel && chart.getZoomLevel() > 1.5) {
            ctx.font = 'bold 8px Arial';
            ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(name.length > 12 ? name.substring(0, 10) + '...' : name, point.x, point.y + size/2 + 10);
          }
          
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
              const margin = 6;
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
          
          // Add a hovering indicator that appears when point is hovered
          if (meta.controller.active && meta.controller.active.includes(point)) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, size / 2 + 5, 0, 2 * Math.PI);
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
            ctx.setLineDash([]);
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

    // Add a deterministic jitter function to consistently move overlapping points
    // Using the framework name as a seed for consistent jittering
    const addDeterministicJitter = (value: number, name: string, amount: number = 0.02): number => {
      // Don't jitter if the value is 0 or 1, to maintain boundary points
      if (value === 0 || value === 1) return value;
      
      // Use the name to create a deterministic "random" value
      // This ensures the same framework always gets the same jitter amount
      const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const pseudoRandom = (nameHash % 100) / 100; // value between 0 and 1
      return value + (pseudoRandom - 0.5) * amount;
    };
    
    // Create a map to track positions and avoid overlaps
    const positionMap: Record<string, {frameworks: string[], count: number}> = {};
    
    setChartData({
      datasets: [
        {
          label: 'AI Agent Tools',
          data: frameworks.map(framework => {
            // Create a unique position for each point
            let x = framework.code_level;
            let y = framework.complexity;
            const key = `${x.toFixed(2)},${y.toFixed(2)}`;
            
            // Track overlapping frameworks at each position
            if (!positionMap[key]) {
              positionMap[key] = {frameworks: [framework.name], count: 1};
            } else {
              positionMap[key].frameworks.push(framework.name);
              positionMap[key].count += 1;
              
              // Apply deterministic jitter based on framework name
              x = addDeterministicJitter(x, framework.name);
              y = addDeterministicJitter(y, framework.name);
            }
            
            return {
              x,
              y,
              name: framework.name,
              description: framework.description,
              category: framework.category,
              url: framework.url,
              logo_url: framework.logo_url,
              // Store original values for tooltip and lookup
              originalX: framework.code_level,
              originalY: framework.complexity
            };
          }),
          backgroundColor: 'transparent', // Using transparent since we're rendering our own circles
          pointRadius: 16, // Match with the hit detection in onClick handler
          pointHoverRadius: 16, // Keep the same as pointRadius to avoid visual confusion
          pointStyle: 'circle',
          hitRadius: 1, // Near-zero hit radius to disable Chart.js internal clustering
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
    // Disable all Chart.js interaction modes to prevent clustering behavior
    interaction: {
      mode: 'point', // Strict point mode - only interact with exact points
      intersect: true, // Require direct intersection for hover/click
      includeInvisible: false, // Ignore invisible points
      axis: 'xy' // Require both x and y intersection
    },
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
      // Completely bypass Chart.js clustering by using direct position detection
      if (chart && event?.native) {
        // Get exact mouse position
        const rect = chart.canvas.getBoundingClientRect();
        const mouseX = event.native.clientX - rect.left;
        const mouseY = event.native.clientY - rect.top;
        
        // Get all points and their exact positions
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        
        // Find the EXACT point under cursor, no clustering or nearest-neighbor
        for (let i = 0; i < meta.data.length; i++) {
          const point = meta.data[i];
          const pointX = point.x;
          const pointY = point.y;
          
          // Check if mouse is inside the point's circle (16px radius matches our visual size)
          const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));
          
          // Only open if mouse is DIRECTLY on this point - using much smaller radius
          if (distance <= 16) {
            const dataPoint = dataset.data[i];
            console.log("EXACT point clicked:", dataPoint.name, "distance:", distance);
            
            const framework = frameworksByName.current[dataPoint.name];
            if (framework) {
              setSelectedFramework(framework);
              setDialogOpen(true);
            }
            
            // Important: return after finding the direct hit to prevent multiple dialogs
            return;
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