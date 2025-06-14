
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface NotificationHeaderProps {
  unreadCount: number;
  loading: boolean;
  onMarkAllRead: () => void;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  loading,
  onMarkAllRead
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="font-semibold">Notifications</h3>
      {unreadCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onMarkAllRead}
          disabled={loading}
        >
          <Check className="h-4 w-4 mr-1" />
          Mark all read
        </Button>
      )}
    </div>
  );
};

export default NotificationHeader;
