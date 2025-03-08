'use client';

import { AgentFramework } from '@/lib/csv-parser';
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
        <DialogHeader>
          <DialogTitle>{framework.name}</DialogTitle>
          <DialogDescription>
            {framework.category} • Code Level: {framework.code_level} • Complexity: {framework.complexity}
          </DialogDescription>
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