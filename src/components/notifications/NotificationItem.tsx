
import React from 'react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  idea_id?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
        notification.is_read 
          ? 'border-l-gray-200 opacity-60' 
          : 'border-l-blue-500'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">
          {getNotificationIcon(notification.type)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {notification.title}
          </p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(notification.created_at), 'MMM d, HH:mm')}
          </p>
        </div>
        {!notification.is_read && (
          <div className="h-2 w-2 bg-blue-500 rounded-full mt-1"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
