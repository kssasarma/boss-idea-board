
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  submitting: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, submitting }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await onSubmit(newComment);
    setNewComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Share your thoughts on this idea..."
        rows={3}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={submitting || !newComment.trim()}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
