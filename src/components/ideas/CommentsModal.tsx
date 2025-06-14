import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useComments } from '@/hooks/useComments';
import CommentsList from './CommentsList';
import CommentForm from './CommentForm';

interface CommentsModalProps {
  ideaId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded?: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  ideaId,
  userId,
  open,
  onOpenChange,
  onCommentAdded
}) => {
  const [ideaTitle, setIdeaTitle] = useState('');
  const { toast } = useToast();
  const { comments, loading, submitting, fetchComments, submitComment } = useComments(ideaId, userId);

  const fetchIdeaTitle = async () => {
    try {
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .select('title')
        .eq('id', ideaId)
        .single();

      if (ideaError) throw ideaError;

      setIdeaTitle(ideaData.title);
    } catch (error) {
      console.error('Error fetching idea title:', error);
      toast({
        title: "Error",
        description: "Failed to fetch idea details",
        variant: "destructive"
      });
    }
  };

  const handleReply = async (text: string, parentCommentId: string) => {
    await submitComment(text, parentCommentId);
    // Don't notify parent for replies since they shouldn't count towards comment count
  };

  const handleNewComment = async (text: string) => {
    await submitComment(text);
    // Only notify parent for top-level comments
    onCommentAdded?.();
  };

  useEffect(() => {
    if (open) {
      fetchComments();
      fetchIdeaTitle();
    }
  }, [ideaId, open, fetchComments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {ideaTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto">
            <CommentsList 
              comments={comments} 
              loading={loading} 
              onReply={handleReply}
              submitting={submitting}
            />
          </div>

          <CommentForm onSubmit={handleNewComment} submitting={submitting} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
