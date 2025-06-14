
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  value: number;
  showPercentage?: boolean;
  size?: 'default' | 'sm';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  showPercentage = true, 
  size = 'default' 
}) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="flex items-center gap-2">
      <Progress 
        value={value} 
        className={`flex-1 ${size === 'sm' ? 'h-2' : 'h-3'}`}
      />
      {showPercentage && (
        <span className={`text-gray-600 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {value}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
