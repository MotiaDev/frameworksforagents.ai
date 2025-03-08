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
          <div className="w-16 h-16 relative flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden">
            {framework.logo_url ? (
              // For SVG files
              <img 
                src={framework.logo_url} 
                alt={`${framework.name} logo`}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  // Fallback for missing logos, display initials
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const container = target.parentElement;
                  if (container) {
                    container.innerHTML = framework.name
                      .split(' ')
                      .slice(0, 2)
                      .map(word => word[0])
                      .join('')
                      .toUpperCase();
                    container.classList.add('text-lg', 'font-bold', 'text-gray-500');
                  }
                }}
              />
            ) : (
              // Display initials if no logo
              <span className="text-lg font-bold text-gray-500">
                {framework.name
                  .split(' ')
                  .slice(0, 2)
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <DialogTitle>{framework.name}</DialogTitle>
            <DialogDescription>
              {framework.category} • Code Level: {framework.code_level} • Complexity: {framework.complexity}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <p>{framework.description}</p>
          </div>
          <div className="mb-4">
            <h4 className="font-medium mb-1">Code Level Justification</h4>
            <p className="text-sm text-gray-700">{framework.code_level_justification}</p>
          </div>
          <div className="mb-4">
            <h4 className="font-medium mb-1">Complexity Justification</h4>
            <p className="text-sm text-gray-700">{framework.complexity_justification}</p>
          </div>
        </div>
        <DialogFooter>
          <Button asChild>
            <a href={framework.url} target="_blank" rel="noopener noreferrer">
              Visit Website <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}