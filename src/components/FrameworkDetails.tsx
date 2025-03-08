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
          
          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="bg-muted/30 p-3 rounded-lg">
              <h4 className="font-semibold mb-1.5 text-primary">Code Level: {framework.code_level.toFixed(1)}</h4>
              <p className="text-sm text-foreground/80">{framework.code_level_justification}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <h4 className="font-semibold mb-1.5 text-primary">Complexity: {framework.complexity.toFixed(1)}</h4>
              <p className="text-sm text-foreground/80">{framework.complexity_justification}</p>
            </div>
            
            {framework.learning_curve !== undefined && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="font-semibold mb-1.5 text-primary">Learning Curve: {framework.learning_curve.toFixed(1)}</h4>
                <p className="text-sm text-foreground/80">{framework.learning_curve_justification || "No justification provided."}</p>
              </div>
            )}
            
            {framework.scalability !== undefined && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="font-semibold mb-1.5 text-primary">Scalability: {framework.scalability.toFixed(1)}</h4>
                <p className="text-sm text-foreground/80">{framework.scalability_justification || "No justification provided."}</p>
              </div>
            )}
            
            {framework.integration_score !== undefined && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="font-semibold mb-1.5 text-primary">Integration: {framework.integration_score.toFixed(1)}</h4>
                <p className="text-sm text-foreground/80">{framework.integration_score_justification || "No justification provided."}</p>
              </div>
            )}
            
            {framework.observability !== undefined && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="font-semibold mb-1.5 text-primary">Observability: {framework.observability.toFixed(1)}</h4>
                <p className="text-sm text-foreground/80">{framework.observability_justification || "No justification provided."}</p>
              </div>
            )}
          </div>
          
          {/* Additional details */}
          <div className="mb-5">
            <h4 className="font-semibold mb-2 text-primary">Framework Details</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {framework.programming_language && (
                <>
                  <dt className="font-medium text-foreground/80">Languages:</dt>
                  <dd>{framework.programming_language.join(', ')}</dd>
                </>
              )}
              
              {framework.user_interface_availability !== undefined && (
                <>
                  <dt className="font-medium text-foreground/80">Has UI:</dt>
                  <dd>{framework.user_interface_availability ? 'Yes' : 'No'}</dd>
                </>
              )}
              
              {framework.communication_protocols && (
                <>
                  <dt className="font-medium text-foreground/80">Communication:</dt>
                  <dd>{framework.communication_protocols.join(', ')}</dd>
                </>
              )}
              
              {framework.license && (
                <>
                  <dt className="font-medium text-foreground/80">License:</dt>
                  <dd>{framework.license}</dd>
                </>
              )}
              
              {framework.update_frequency_and_maintenance !== undefined && (
                <>
                  <dt className="font-medium text-foreground/80">Actively Maintained:</dt>
                  <dd>{framework.update_frequency_and_maintenance ? 'Yes' : 'No'}</dd>
                </>
              )}
              
              {framework.deployment_platform && (
                <>
                  <dt className="font-medium text-foreground/80">Deployment:</dt>
                  <dd>{typeof framework.deployment_platform === 'string' 
                    ? framework.deployment_platform 
                    : framework.deployment_platform.join(', ')}
                  </dd>
                </>
              )}
            </dl>
          </div>
          
          {/* Use cases */}
          {framework.use_cases_and_applications && (
            <div className="mb-5 bg-muted/30 p-3 rounded-lg">
              <h4 className="font-semibold mb-1.5 text-primary">Use Cases</h4>
              <p className="text-sm text-foreground/80">{framework.use_cases_and_applications}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-2 flex flex-wrap gap-2">
          {/* Primary button for website */}
          {(framework.website_url || framework.url) && (
            <Button asChild 
              className="transition-colors text-white" 
              style={{ 
                backgroundColor: getFrameworkColor(framework.name),
                "&:hover": {
                  backgroundColor: `${getFrameworkColor(framework.name)}CC`,
                }
              }}
            >
              <a href={framework.website_url || framework.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <span>Visit Website</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          
          {/* Additional link buttons */}
          {framework.github_url && (
            <Button asChild variant="outline" size="sm">
              <a href={framework.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <span>GitHub</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
          
          {framework.docs_url && (
            <Button asChild variant="outline" size="sm">
              <a href={framework.docs_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <span>Docs</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
          
          {framework.community_url && (
            <Button asChild variant="outline" size="sm">
              <a href={framework.community_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <span>Community</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}