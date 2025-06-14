
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommentWithProfile {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  idea_id: string;
  parent_comment_id: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  replies?: CommentWithProfile[];
}

export const useComments = (ideaId: string, userId: string) => {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      // First get all comments for this idea
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get unique user IDs from comments
      const userIds = [...new Set(commentsData?.map(comment => comment.user_id).filter(Boolean) || [])];

      // Fetch profiles for all users
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map();
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Organize comments into parent-child structure
      const commentsMap = new Map<string, CommentWithProfile>();
      const rootComments: CommentWithProfile[] = [];

      // First pass: create all comment objects with profiles
      commentsData?.forEach(comment => {
        const profile = profilesMap.get(comment.user_id);
        const commentWithProfile: CommentWithProfile = {
          id: comment.id,
          text: comment.text || '',
          created_at: comment.created_at || '',
          user_id: comment.user_id || '',
          idea_id: comment.idea_id || '',
          parent_comment_id: comment.parent_comment_id,
          profile: profile ? {
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url
          } : undefined,
          replies: []
        };
        commentsMap.set(comment.id, commentWithProfile);
      });

      // Second pass: organize into parent-child structure
      commentsMap.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [ideaId, toast]);

  const submitComment = useCallback(async (text: string, parentCommentId?: string) => {
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          text: text.trim(),
          parent_comment_id: parentCommentId || null
        });

      if (error) throw error;

      await fetchComments();
      
      toast({
        title: "Success",
        description: parentCommentId ? "Reply added successfully" : "Comment added successfully"
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive"
      });
    }
    setSubmitting(false);
  }, [ideaId, userId, fetchComments, toast]);

  return {
    comments,
    loading,
    submitting,
    fetchComments,
    submitComment
  };
};
