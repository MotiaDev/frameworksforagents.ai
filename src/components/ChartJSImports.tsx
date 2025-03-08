'use client';

import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  registerables
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register ALL Chart.js components to ensure everything is available
ChartJS.register(
  ...registerables,
  CategoryScale,
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend,
  zoomPlugin
);

// This component doesn't render anything, it just registers Chart.js components
export default function ChartJSImports() {
  return null;
}