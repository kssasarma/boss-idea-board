
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';
import ProgressBar from '../ProgressBar';

interface IdeaStatusSectionProps {
  status: string;
  priority: string;
  businessUnit?: string;
  progress?: number;
}

const IdeaStatusSection: React.FC<IdeaStatusSectionProps> = ({
  status,
  priority,
  businessUnit,
  progress
}) => {
  return (
    <div className="space-y-4">
      {/* Status and Priority Row */}
      <div className="flex items-center gap-4">
        <StatusBadge status={status} />
        <PriorityBadge priority={priority} />
        {businessUnit && (
          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
            <Building2 className="h-3 w-3" />
            {businessUnit}
          </Badge>
        )}
      </div>

      {/* Progress */}
      {(progress !== null && progress !== undefined && progress >= 0) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Progress: {progress}%</span>
          </div>
          <ProgressBar value={progress} size="default" />
        </div>
      )}
    </div>
  );
};

export default IdeaStatusSection;
