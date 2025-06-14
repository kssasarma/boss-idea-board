
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GitlabIntegration {
  id: string;
  idea_id: string;
  gitlab_project_id: string;
  gitlab_project_url: string;
  last_sync_at: string | null;
  total_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
}

export const useGitlab = (ideaId: string) => {
  const [integration, setIntegration] = useState<GitlabIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchIntegration = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('idea_gitlab_integration')
        .select('*')
        .eq('idea_id', ideaId)
        .maybeSingle();

      if (error) throw error;
      setIntegration(data);
    } catch (error) {
      console.error('Error fetching GitLab integration:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GitLab integration",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [ideaId, toast]);

  const createIntegration = useCallback(async (
    projectId: string,
    projectUrl: string,
    accessToken?: string
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('idea_gitlab_integration')
        .insert({
          idea_id: ideaId,
          gitlab_project_id: projectId,
          gitlab_project_url: projectUrl,
          access_token_encrypted: accessToken || null
        });

      if (error) throw error;

      await fetchIntegration();
      
      toast({
        title: "Success",
        description: "GitLab integration created successfully"
      });
    } catch (error) {
      console.error('Error creating GitLab integration:', error);
      toast({
        title: "Error",
        description: "Failed to create GitLab integration",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [ideaId, fetchIntegration, toast]);

  const syncIssues = useCallback(async () => {
    if (!integration) return;
    
    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc('sync_gitlab_issues', {
        p_idea_id: ideaId
      });

      if (error) throw error;

      // Update progress based on synced data
      await supabase.rpc('update_idea_progress_from_gitlab', {
        p_idea_id: ideaId
      });

      await fetchIntegration();
      
      toast({
        title: "Success",
        description: "GitLab issues synced successfully"
      });
    } catch (error) {
      console.error('Error syncing GitLab issues:', error);
      toast({
        title: "Info",
        description: "GitLab sync feature is not fully implemented yet",
        variant: "default"
      });
    }
    setSyncing(false);
  }, [integration, ideaId, fetchIntegration, toast]);

  const removeIntegration = useCallback(async () => {
    if (!integration) return;
    
    try {
      const { error } = await supabase
        .from('idea_gitlab_integration')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;

      setIntegration(null);
      
      toast({
        title: "Success",
        description: "GitLab integration removed successfully"
      });
    } catch (error) {
      console.error('Error removing GitLab integration:', error);
      toast({
        title: "Error",
        description: "Failed to remove GitLab integration",
        variant: "destructive"
      });
    }
  }, [integration, toast]);

  return {
    integration,
    loading,
    syncing,
    fetchIntegration,
    createIntegration,
    syncIssues,
    removeIntegration
  };
};
