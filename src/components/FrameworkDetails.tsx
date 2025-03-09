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
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] p-4">
        <DialogHeader className="flex flex-col items-center sm:flex-row sm:items-start gap-4 pb-2 border-b border-border/20 mb-4">
          <div className="w-24 h-24 relative flex-shrink-0 flex items-center justify-center">
            {/* White circle background */}
            <div className="absolute inset-0 rounded-full bg-white shadow-sm"></div>
            
            {/* Colored border with glow - using dynamic color based on framework name */}
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${getFrameworkColor(framework.name)}CC` }}></div>
            <div className="absolute inset-0 -m-0.5 rounded-full border" style={{ borderColor: `${getFrameworkColor(framework.name)}4D` }}></div>
            
            {/* Logo or initials */}
            <div className="relative z-10 w-20 h-20 flex items-center justify-center overflow-hidden">
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
                      container.classList.add('text-xl', 'font-bold');
                      container.style.color = getFrameworkColor(framework.name);
                    }
                  }}
                />
              ) : (
                <span className="text-xl font-bold" style={{ color: getFrameworkColor(framework.name) }}>
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
            <DialogTitle className="text-2xl font-bold">{framework.name}</DialogTitle>
            <div className="flex flex-wrap gap-2 mt-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-sm font-medium" 
                style={{ 
                  backgroundColor: `${getFrameworkColor(framework.name)}1A`, 
                  color: getFrameworkColor(framework.name) 
                }}
              >{framework.category}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-foreground/80">
              <div className="flex items-center gap-1">
                <span className="font-medium">Code Level:</span>
                <span>{framework.code_level.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Complexity:</span>
                <span>{framework.complexity.toFixed(1)}</span>
              </div>
              {framework.learning_curve !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Learning:</span>
                  <span>{framework.learning_curve.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="pt-0 pb-4">
          {/* Description and use cases side by side if use cases exist, otherwise full width */}
          <div className={`grid grid-cols-1 ${framework.use_cases_and_applications ? 'lg:grid-cols-2' : ''} gap-4 mb-4`}>
            <div className="bg-muted/10 p-3 rounded-lg">
              <h4 className="font-medium mb-1 text-primary text-sm">Description</h4>
              <p className="text-foreground text-sm">{framework.description}</p>
            </div>
            
            {framework.use_cases_and_applications && (
              <div className="bg-muted/10 p-3 rounded-lg">
                <h4 className="font-medium mb-1 text-primary text-sm">Use Cases</h4>
                <p className="text-foreground text-sm">{framework.use_cases_and_applications}</p>
              </div>
            )}
          </div>
          
          {/* Key metrics - 2 columns for better readability */}
          <div className="mb-4">
            <h4 className="font-medium mb-1.5 text-primary text-sm">Key Metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* First row - always present metrics */}
              <div className="bg-muted/30 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-primary text-xs">Code Level</h5>
                  <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                    {framework.code_level.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{framework.code_level_justification}</p>
              </div>
              
              <div className="bg-muted/30 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-primary text-xs">Complexity</h5>
                  <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                    {framework.complexity.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{framework.complexity_justification}</p>
              </div>
              
              {/* Optional metrics */}
              {framework.learning_curve !== undefined && (
                <div className="bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-primary text-xs">Learning Curve</h5>
                    <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                      {framework.learning_curve.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">
                    {framework.learning_curve_justification || "No justification provided."}
                  </p>
                </div>
              )}
              
              {framework.scalability !== undefined && (
                <div className="bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-primary text-xs">Scalability</h5>
                    <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                      {framework.scalability.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">
                    {framework.scalability_justification || "No justification provided."}
                  </p>
                </div>
              )}
              
              {framework.integration_score !== undefined && (
                <div className="bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-primary text-xs">Integration</h5>
                    <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                      {framework.integration_score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">
                    {framework.integration_score_justification || "No justification provided."}
                  </p>
                </div>
              )}
              
              {framework.observability !== undefined && (
                <div className="bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-primary text-xs">Observability</h5>
                    <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                      {framework.observability.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">
                    {framework.observability_justification || "No justification provided."}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional details - inline display for better space usage */}
          <div className="mb-3">
            <h4 className="font-medium mb-1.5 text-primary text-sm">Framework Details</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {framework.programming_language && framework.programming_language.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground/90">Languages:</span>
                  <span className="text-foreground/70">{framework.programming_language.join(', ')}</span>
                </div>
              )}
              
              {framework.user_interface_availability !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground/90">Has UI:</span>
                  <span className="text-foreground/70">{framework.user_interface_availability ? 'Yes' : 'No'}</span>
                </div>
              )}
              
              {framework.communication_protocols && framework.communication_protocols.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground/90">Communication:</span>
                  <span className="text-foreground/70">{framework.communication_protocols.join(', ')}</span>
                </div>
              )}
              
              {framework.license && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground/90">License:</span>
                  <span className="text-foreground/70">{framework.license}</span>
                </div>
              )}
              
              {framework.update_frequency_and_maintenance !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground/90">Actively Maintained:</span>
                  <span className="text-foreground/70">{framework.update_frequency_and_maintenance ? 'Yes' : 'No'}</span>
                </div>
              )}
              
              {framework.deployment_platform && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground/90">Deployment:</span>
                  <span className="text-foreground/70">
                    {typeof framework.deployment_platform === 'string' 
                      ? framework.deployment_platform 
                      : Array.isArray(framework.deployment_platform) ? framework.deployment_platform.join(', ') : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Use cases section moved to be alongside description */}
        </div>
        
        <DialogFooter className="mt-1 border-t border-border/20 pt-2 flex justify-between items-center flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {/* Additional link buttons */}
            {framework.github_url && (
              <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                <a href={framework.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <span>GitHub</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
            
            {framework.docs_url && (
              <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                <a href={framework.docs_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <span>Docs</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
            
            {framework.community_url && (
              <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                <a href={framework.community_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <span>Community</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
          
          {/* Primary button for website */}
          {(framework.website_url || framework.url) && (
            <Button asChild 
              className="transition-colors text-white ml-auto h-8 px-3 text-xs hover:opacity-90" 
              style={{ 
                backgroundColor: getFrameworkColor(framework.name)
              }}
            >
              <a href={framework.website_url || framework.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <span>Visit Website</span>
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}