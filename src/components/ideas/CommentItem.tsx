
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply } from 'lucide-react';
import { format } from 'date-fns';
import type { CommentWithProfile } from '@/hooks/useComments';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: CommentWithProfile;
  onReply?: (text: string, parentCommentId: string) => Promise<void>;
  submitting?: boolean;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onReply, 
  submitting = false,
  isReply = false 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const getDisplayName = () => {
    return comment.profile?.full_name || 'Anonymous';
  };

  const getInitials = () => {
    const name = comment.profile?.full_name || 'Anonymous';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleReply = async (text: string) => {
    if (onReply) {
      await onReply(text, comment.id);
      setShowReplyForm(false);
    }
  };

  return (
    <div className={`space-y-2 ${isReply ? 'ml-8 border-l-2 border-blue-100 pl-4' : ''}`}>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500">
                  {comment.created_at && format(new Date(comment.created_at), 'MMM d, yyyy at h:mm a')}
                </p>
              </div>
              <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
              {!isReply && onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showReplyForm && (
        <div className="ml-11">
          <CommentForm onSubmit={handleReply} submitting={submitting} />
        </div>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          isReply={true}
        />
      ))}
    </div>
  );
};

export default CommentItem;
