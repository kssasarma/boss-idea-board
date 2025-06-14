
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Play, Pause, X, FileText, Eye, Lightbulb } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'default' | 'sm' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', icon: FileText, variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
      case 'submitted':
        return { label: 'Submitted', icon: Lightbulb, variant: 'default' as const, color: 'bg-blue-100 text-blue-800' };
      case 'in_review':
        return { label: 'In Review', icon: Eye, variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { label: 'Approved', icon: CheckCircle, variant: 'default' as const, color: 'bg-green-100 text-green-800' };
      case 'in_progress':
        return { label: 'In Progress', icon: Play, variant: 'default' as const, color: 'bg-purple-100 text-purple-800' };
      case 'completed':
        return { label: 'Completed', icon: CheckCircle, variant: 'default' as const, color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { label: 'Cancelled', icon: X, variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
      case 'on_hold':
        return { label: 'On Hold', icon: Pause, variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'Unknown', icon: FileText, variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
