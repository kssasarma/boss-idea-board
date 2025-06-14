
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface IdeaActionsSectionProps {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  liking: boolean;
  createdAt?: string;
  currentUserId?: string;
  onLike: () => void;
  onCommentsClick: () => void;
}

const IdeaActionsSection: React.FC<IdeaActionsSectionProps> = ({
  likesCount,
  commentsCount,
  isLiked,
  liking,
  createdAt,
  currentUserId,
  onLike,
  onCommentsClick
}) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-blue-100">
      <div className="flex gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          disabled={liking || !currentUserId}
          className={`flex items-center gap-2 hover:bg-blue-50 ${
            isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          {likesCount}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCommentsClick}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
        >
          <MessageCircle className="h-4 w-4" />
          {commentsCount}
        </Button>
      </div>
      
      {createdAt && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-3 w-3" />
          Last updated {format(new Date(createdAt), 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
};

export default IdeaActionsSection;
