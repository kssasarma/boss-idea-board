
import React from 'react';
import CommentItem from './CommentItem';
import type { CommentWithProfile } from '@/hooks/useComments';

interface CommentsListProps {
  comments: CommentWithProfile[];
  loading: boolean;
  onReply?: (text: string, parentCommentId: string) => Promise<void>;
  submitting?: boolean;
}

const CommentsList: React.FC<CommentsListProps> = ({ 
  comments, 
  loading, 
  onReply, 
  submitting 
}) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse text-gray-500">Loading comments...</div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          onReply={onReply}
          submitting={submitting}
        />
      ))}
    </div>
  );
};

export default CommentsList;
