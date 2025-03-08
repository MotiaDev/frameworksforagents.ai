'use client';

import { AgentFramework } from '@/lib/data-parser';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';

// Function to get a consistent color for a framework based on its name
// This ensures the same colors are used in both chart and details modal
const getFrameworkColor = (name: string): string => {
  // Map framework name to actual color values (not Tailwind classes)
  const colorOptions = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
    '#007BFF', '#6610F2', '#6F42C1', '#E83E8C', // Bootstrap colors
    '#FF5722', '#009688', '#673AB7', '#3F51B5'  // Material colors
  ];
  
  // Use a simple hash of the framework name to consistently pick the same color
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorOptions[nameHash % colorOptions.length];
};

interface FrameworkDetailsProps {
  framework: AgentFramework | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FrameworkDetails({
  framework,
  open,
  onOpenChange
}: FrameworkDetailsProps) {
  if (!framework) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
          <div className="w-20 h-20 relative flex-shrink-0 flex items-center justify-center">
            {/* White circle background */}
            <div className="absolute inset-0 rounded-full bg-white shadow-sm"></div>
            
            {/* Colored border with glow - using dynamic color based on framework name */}
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${getFrameworkColor(framework.name)}CC` }}></div>
            <div className="absolute inset-0 -m-0.5 rounded-full border" style={{ borderColor: `${getFrameworkColor(framework.name)}4D` }}></div>
            
            {/* Logo or initials */}
            <div className="relative z-10 w-16 h-16 flex items-center justify-center overflow-hidden">
              {framework.logo_url ? (
                <img
                  src={framework.logo_url}
                  alt={`${framework.name} logo`}
                  className="max-w-[85%] max-h-[85%] object-contain"
                  onError={(e) => {
                    // If image fails, show initials
                    e.currentTarget.style.display = 'none';
                    const container = e.currentTarget.parentElement;
                    if (container) {
                      container.innerHTML = framework.name
                        .split(' ')
                        .slice(0, 2)
                        .map(word => word[0])
                        .join('')
                        .toUpperCase();
                      container.classList.add('text-lg', 'font-bold', 'text-blue-500');
                    }
                  }}
                />
              ) : (
                <span className="text-lg font-bold text-blue-500">
                  {framework.name
                    .split(' ')
                    .slice(0, 2)
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex-grow sm:pt-2">
            <DialogTitle className="text-xl">{framework.name}</DialogTitle>
            <DialogDescription className="text-sm flex flex-wrap gap-x-2 mt-1">
              <span className="px-2 py-0.5 rounded-full font-medium" 
                style={{ 
                  backgroundColor: `${getFrameworkColor(framework.name)}1A`, 
                  color: getFrameworkColor(framework.name) 
                }}
              >{framework.category}</span>
              <span>Code Level: {framework.code_level.toFixed(1)}</span>
              <span>Complexity: {framework.complexity.toFixed(1)}</span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-5">
            <p className="text-foreground">{framework.description}</p>
          </div>
          <div className="mb-5 bg-muted/30 p-3 rounded-lg">
            <h4 className="font-semibold mb-1.5 text-primary">Code Level: {framework.code_level.toFixed(1)}</h4>
            <p className="text-sm text-foreground/80">{framework.code_level_justification}</p>
          </div>
          <div className="mb-3 bg-muted/30 p-3 rounded-lg">
            <h4 className="font-semibold mb-1.5 text-primary">Complexity: {framework.complexity.toFixed(1)}</h4>
            <p className="text-sm text-foreground/80">{framework.complexity_justification}</p>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button asChild 
            className="transition-colors text-white" 
            style={{ 
              backgroundColor: getFrameworkColor(framework.name),
              "&:hover": {
                backgroundColor: `${getFrameworkColor(framework.name)}CC`,
              }
            }}
          >
            <a href={framework.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <span>Visit Website</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}