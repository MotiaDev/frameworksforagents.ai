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
  
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 68 68">
    <circle cx="34" cy="34" r="34" fill="white" />
    <text x="34" y="44" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="${initialsColor}">${initials}</text>
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
          const size = 68; // Significantly increased icon size for better visibility
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
          ctx.lineWidth = 3; // Increased from 2 to 3 for better visibility
          ctx.strokeStyle = borderColor;
          ctx.stroke();
          
          // Add subtle outer glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, size / 2 + 3, 0, 2 * Math.PI); // Increased from +2 to +3
          ctx.lineWidth = 1.5; // Slightly thicker glow
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
              const margin = 8; // Slightly increased margin for larger icons
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
          
          // No hover effects in the plugin - we'll handle interaction separately
        }
      });
    });
  }
});

// ChartJS components will be dynamically registered when component mounts
// This must happen before any chart is rendered!

// Define the possible axis metrics for the chart
export type AxisMetric = {
  key: keyof AgentFramework;
  label: string;
  description: string;
  isNumeric: boolean;
}

// Define all available metrics that can be used for axes
export const availableMetrics: AxisMetric[] = [
  { key: 'code_level', label: 'Code Level', description: 'Amount of coding required (0 = no code, 1 = heavy coding)', isNumeric: true },
  { key: 'complexity', label: 'Complexity', description: 'Overall complexity of the solution (0 = simple, 1 = complex)', isNumeric: true },
  { key: 'learning_curve', label: 'Learning Curve', description: 'Steepness of the learning curve (0 = easy to learn, 1 = difficult to master)', isNumeric: true },
  { key: 'scalability', label: 'Scalability', description: 'How well the framework scales (0 = limited scalability, 1 = highly scalable)', isNumeric: true },
  { key: 'integration_score', label: 'Integration', description: 'Ease of integration with other systems (0 = limited integrations, 1 = extensive integrations)', isNumeric: true },
  { key: 'observability', label: 'Observability', description: 'Level of monitoring and observability (0 = limited visibility, 1 = comprehensive monitoring)', isNumeric: true },
  { key: 'programming_language_support', label: 'Language Support', description: 'Breadth of programming language support (0 = single language, 1 = many languages)', isNumeric: true },
];

interface ScatterPlotProps {
  frameworks: AgentFramework[];
  onResetAllFilters?: () => void;
}

export default function ScatterPlot({ frameworks, onResetAllFilters }: ScatterPlotProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedFramework, setSelectedFramework] = useState<AgentFramework | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const chartRef = useRef<any>(null);
  
  // State for axis selection
  const [xAxisMetric, setXAxisMetric] = useState<AxisMetric>(availableMetrics[0]);
  const [yAxisMetric, setYAxisMetric] = useState<AxisMetric>(availableMetrics[1]);
  
  // State for filters
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [hasUIFilter, setHasUIFilter] = useState<boolean | null>(null);
  const [minLearningCurve, setMinLearningCurve] = useState<number>(0);
  const [maxLearningCurve, setMaxLearningCurve] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Gather unique categories for filter options
  const uniqueCategories = Array.from(new Set(frameworks.map(f => f.category)));
  
  // Create lookup maps for efficiently finding frameworks by name
  const frameworksByName = useRef<Record<string, AgentFramework>>({});
  
  // Filter frameworks based on selected filters
  const getFilteredFrameworks = (): AgentFramework[] => {
    return frameworks.filter(framework => {
      // Filter by category if any categories are selected
      if (categoryFilter.length > 0 && !categoryFilter.includes(framework.category)) {
        return false;
      }
      
      // Filter by UI availability if UI filter is set
      if (hasUIFilter !== null && framework.user_interface_availability !== hasUIFilter) {
        return false;
      }
      
      // Filter by learning curve range
      if (framework.learning_curve !== undefined) {
        if (framework.learning_curve < minLearningCurve || framework.learning_curve > maxLearningCurve) {
          return false;
        }
      }
      
      return true;
    });
  };
  
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
    
    // Apply filters to get the current set of frameworks to display
    const filteredFrameworks = getFilteredFrameworks();
    
    setChartData({
      datasets: [
        {
          label: 'AI Agent Tools',
          data: filteredFrameworks.map(framework => {
            // Get the values for the selected axes with fallbacks
            let x = framework[xAxisMetric.key] as number;
            let y = framework[yAxisMetric.key] as number;
            
            // Handle undefined values (fall back to 0)
            if (x === undefined) x = 0;
            if (y === undefined) y = 0;
            
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
            
            // For URL backwards compatibility
            const url = framework.website_url || framework.url || framework.github_url;
            
            return {
              x,
              y,
              name: framework.name,
              description: framework.description,
              category: framework.category,
              url: url,
              logo_url: framework.logo_url,
              // Store all relevant data for tooltips
              originalX: framework[xAxisMetric.key] as number || 0,
              originalY: framework[yAxisMetric.key] as number || 0,
              xAxisKey: xAxisMetric.key,
              yAxisKey: yAxisMetric.key,
              hasUI: framework.user_interface_availability,
              learningCurve: framework.learning_curve,
              programming_languages: framework.programming_language
            };
          }),
          backgroundColor: 'transparent', // Using transparent since we're rendering our own circles
          pointRadius: 34, // Match with the hit detection radius (68px diameter ÷ 2)
          pointHoverRadius: 34, // Keep the same as pointRadius to avoid visual confusion
          pointStyle: 'circle',
          hitRadius: 1, // Near-zero hit radius to disable Chart.js internal clustering
        }
      ],
    });
  }, [frameworks, xAxisMetric, yAxisMetric, categoryFilter, hasUIFilter, minLearningCurve, maxLearningCurve]);

  // Simple helper to find a framework by name
  const findFramework = (name: string) => {
    return frameworks.find(f => f.name === name);
  };
  
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
    
    // Import Chart.js
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
    // Use direct point interaction mode
    interaction: {
      mode: 'point',  // Only select specific points
      intersect: true  // Must intersect exactly with the point
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: xAxisMetric.label,
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
          text: yAxisMetric.label,
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
        enabled: true,
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
          title: (context: any[]) => {
            if (context.length === 0) return '';
            return context[0].raw.name;
          },
          label: (context: any) => {
            const data = context.raw;
            
            // Use original values if available
            const xValue = data.originalX !== undefined ? data.originalX : data.x;
            const yValue = data.originalY !== undefined ? data.originalY : data.y;
            
            return [
              `Category: ${data.category}`,
              `${xAxisMetric.label}: ${xValue.toFixed(1)}`,
              `${yAxisMetric.label}: ${yValue.toFixed(1)}`
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
    // Simple direct click handler - only opens the framework if clicked directly
    onClick: (event: any, elements: any[], chart: any) => {
      // If no elements are clicked, do nothing
      if (!elements || elements.length === 0) return;
      
      // Get the element's data
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const dataPoint = chart.data.datasets[datasetIndex].data[index];
      
      // Find the framework 
      const framework = findFramework(dataPoint.name);
      if (framework) {
        setSelectedFramework(framework);
        setDialogOpen(true);
      }
    }
  };

  const resetZoom = () => {
    try {
      console.log("Resetting zoom...");
      if (chartRef.current) {
        // Access the underlying Chart.js instance
        const chartInstance = chartRef.current.chartInstance;
        
        if (chartInstance) {
          console.log("Using chartInstance.resetZoom()");
          chartInstance.resetZoom();
        } else if (typeof chartRef.current.resetZoom === 'function') {
          console.log("Using chartRef.current.resetZoom()");
          chartRef.current.resetZoom();
        } else if (chartRef.current.getChart && typeof chartRef.current.getChart().resetZoom === 'function') {
          console.log("Using getChart().resetZoom()");
          chartRef.current.getChart().resetZoom();
        } else {
          console.log("Cannot find resetZoom method");
          // Fallback to manually resetting scales
          const chart = chartRef.current;
          if (chart.scales && chart.scales.x && chart.scales.y) {
            console.log("Manually resetting scales");
            chart.scales.x.min = 0;
            chart.scales.x.max = 1;
            chart.scales.y.min = 0;
            chart.scales.y.max = 1;
            chart.update();
          }
        }
      }
    } catch (error) {
      console.error("Error resetting zoom:", error);
    }
  };
  
  // Function to reset all filters including search from parent
  const resetAllFilters = () => {
    // Reset internal filters
    setCategoryFilter([]);
    setHasUIFilter(null);
    setMinLearningCurve(0);
    setMaxLearningCurve(1);
    
    // Call parent's reset function to clear search if provided
    if (onResetAllFilters) {
      onResetAllFilters();
    }
  };

  // No custom handlers needed - using Chart.js built-in events
  
  // Make sure both ChartJS and chart data are loaded
  if (!chartData) return <div>Loading...</div>;
  
  // Handlers for axis and filter changes
  const handleXAxisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMetric = availableMetrics.find(m => m.key === e.target.value);
    if (selectedMetric) setXAxisMetric(selectedMetric);
  };
  
  const handleYAxisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMetric = availableMetrics.find(m => m.key === e.target.value);
    if (selectedMetric) setYAxisMetric(selectedMetric);
  };
  
  const handleCategoryToggle = (category: string) => {
    setCategoryFilter(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  return (
    <div className="w-full h-full">
      {/* Control panel - fixed at top, more horizontal layout */}
      <div className="absolute top-14 left-0 right-0 z-10 flex justify-center">
        <div className="flex flex-wrap gap-2 p-2 mx-2 bg-card/80 backdrop-blur-sm rounded-md shadow-md border border-border/50">
          {/* Axis controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium whitespace-nowrap">X:</label>
              <select 
                value={xAxisMetric.key}
                onChange={handleXAxisChange}
                className="text-xs p-1 min-w-32 rounded border border-border bg-card text-foreground"
              >
                {availableMetrics.map(metric => (
                  <option key={`x-${metric.key}`} value={metric.key}>{metric.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium whitespace-nowrap">Y:</label>
              <select 
                value={yAxisMetric.key}
                onChange={handleYAxisChange}
                className="text-xs p-1 min-w-32 rounded border border-border bg-card text-foreground"
              >
                {availableMetrics.map(metric => (
                  <option key={`y-${metric.key}`} value={metric.key}>{metric.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="h-6 mx-1 w-px bg-border/50"></div>
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-muted px-2 py-1 text-xs rounded transition-colors border ${showFilters ? 'border-primary' : 'border-border/50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters {showFilters ? '(On)' : ''}</span>
          </button>
          
          <div className="h-6 mx-1 w-px bg-border/50"></div>
          
          {/* Reset button - using window.location.reload as a foolproof method */}
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-muted px-2 py-1 text-xs rounded transition-colors border border-border/50"
            title="Reset view by reloading the page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
              <path d="M3 12h18"/>
              <path d="M12 3v18"/>
            </svg>
            <span>Reset View</span>
          </button>
        </div>
      </div>
      
      {/* Filters panel - slides down when active */}
      {showFilters && (
        <div className="absolute top-28 left-0 right-0 z-10 flex justify-center">
          <div className="mx-2 p-3 bg-card rounded-md shadow-md border border-border/50 max-w-4xl w-full animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium">Filter Frameworks</h3>
              <button
                onClick={resetAllFilters}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
                  <path d="M19 12H5"/>
                  <path d="m12 19-4-4 4-4"/>
                </svg>
                <span>Reset All Filters</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-5">
              {/* Categories */}
              <div className="min-w-56">
                <label className="text-xs font-medium block mb-1.5">Categories</label>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        categoryFilter.includes(category)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-muted'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* UI Filter */}
              <div>
                <label className="text-xs font-medium block mb-1.5">User Interface</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasUIFilter(hasUIFilter === true ? null : true)}
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      hasUIFilter === true
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-muted'
                    } flex items-center gap-1`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h10v2H7z" />
                      <path d="M7 13h6m-6 4h10" stroke={hasUIFilter === true ? 'currentColor' : 'currentColor'} />
                    </svg>
                    <span>Has UI</span>
                  </button>
                  <button
                    onClick={() => setHasUIFilter(hasUIFilter === false ? null : false)}
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      hasUIFilter === false
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-muted'
                    } flex items-center gap-1`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64A9 9 0 0 1 20.77 15"></path>
                      <path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"></path>
                      <path d="M12 2v4"></path>
                      <path d="m2 2 20 20"></path>
                    </svg>
                    <span>No UI</span>
                  </button>
                </div>
              </div>
              
              {/* Learning Curve Range */}
              <div className="flex-grow min-w-40 max-w-96">
                <label className="text-xs font-medium block mb-1.5">
                  Learning Curve: <span className="text-primary">{minLearningCurve.toFixed(1)} - {maxLearningCurve.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1.5 text-[9px]">(0 = Easy to Learn, 1 = Difficult)</span>
                </label>
                <div className="flex flex-col gap-2 px-2 pt-1 pb-2">
                  <div className="relative h-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-[2px] w-full bg-border"></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={minLearningCurve}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val <= maxLearningCurve) setMinLearningCurve(val);
                      }}
                      className="absolute w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <input
                      type="range" 
                      min="0"
                      max="1"
                      step="0.1"
                      value={maxLearningCurve}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val >= minLearningCurve) setMaxLearningCurve(val);
                      }}
                      className="absolute w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>Beginner-friendly</span>
                    <span>Expert-focused</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chart area */}
      <div className="w-full h-full">
        {/* ChartJSImports must be included before any chart is rendered */}
        <ChartJSImports />
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>
      
      {/* Framework details modal */}
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