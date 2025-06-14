
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Circle, Flag, Zap } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
  size?: 'default' | 'sm' | 'lg';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'default' }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'low':
        return { label: 'Low', icon: Circle, color: 'bg-green-100 text-green-800' };
      case 'medium':
        return { label: 'Medium', icon: Flag, color: 'bg-yellow-100 text-yellow-800' };
      case 'high':
        return { label: 'High', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' };
      case 'critical':
        return { label: 'Critical', icon: Zap, color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Medium', icon: Flag, color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default PriorityBadge;
