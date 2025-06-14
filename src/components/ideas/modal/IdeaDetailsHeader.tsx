
import React from 'react';
import { DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Edit, Settings } from 'lucide-react';

interface IdeaDetailsHeaderProps {
  title: string;
  canSubscribe: boolean;
  canEdit: boolean;
  canManageStatus: boolean;
  onSubscribeClick: () => void;
  onEditClick: () => void;
  onManageStatusClick: () => void;
}

const IdeaDetailsHeader: React.FC<IdeaDetailsHeaderProps> = ({
  title,
  canSubscribe,
  canEdit,
  canManageStatus,
  onSubscribeClick,
  onEditClick,
  onManageStatusClick
}) => {
  return (
    <div className="flex justify-between items-start gap-4">
      <DialogTitle className="text-2xl text-blue-900 pr-8">{title}</DialogTitle>
      <div className="flex items-center gap-2 shrink-0">
        {canSubscribe && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSubscribeClick}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Bell className="h-4 w-4" />
          </Button>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {canManageStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageStatusClick}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default IdeaDetailsHeader;
