
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface Team {
  id: string;
  idea_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

export const useTeams = (ideaId: string) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('idea_teams')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      if (!teamsData || teamsData.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      // Fetch team members for all teams
      const teamIds = teamsData.map(team => team.id);
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds);

      if (membersError) throw membersError;

      // Get unique user IDs from members
      const userIds = [...new Set(membersData?.map(m => m.user_id).filter(Boolean) || [])];

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

      // Group members by team and add profiles
      const membersByTeam = new Map<string, TeamMember[]>();
      membersData?.forEach(member => {
        // CHANGED: Cast or default the role to handle only 'leader' | 'member'
        let memberRole: 'leader' | 'member' = member.role === 'leader' ? 'leader' : 'member';
        if (member.role !== 'leader' && member.role !== 'member') {
          memberRole = 'member'; // fallback
        }
        if (!membersByTeam.has(member.team_id)) {
          membersByTeam.set(member.team_id, []);
        }
        membersByTeam.get(member.team_id)!.push({
          ...member,
          role: memberRole,
          profile: profilesMap.get(member.user_id)
        });
      });

      // Combine teams with their members
      const teamsWithMembers = teamsData.map(team => ({
        ...team,
        members: membersByTeam.get(team.id) || []
      }));

      setTeams(teamsWithMembers);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [ideaId, toast]);

  const createTeam = useCallback(async (name: string, description: string) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teamData, error: teamError } = await supabase
        .from('idea_teams')
        .insert({
          idea_id: ideaId,
          name: name.trim(),
          description: description.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add the creator as a team leader
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: user.id,
          role: 'leader'
        });

      if (memberError) throw memberError;

      await fetchTeams();
      
      toast({
        title: "Success",
        description: "Team created successfully"
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive"
      });
    }
    setSubmitting(false);
  }, [ideaId, fetchTeams, toast]);

  const joinTeam = useCallback(async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      await fetchTeams();
      
      toast({
        title: "Success",
        description: "Joined team successfully"
      });
    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: "Error",
        description: "Failed to join team",
        variant: "destructive"
      });
    }
  }, [fetchTeams, toast]);

  const leaveTeam = useCallback(async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchTeams();
      
      toast({
        title: "Success",
        description: "Left team successfully"
      });
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: "Error",
        description: "Failed to leave team",
        variant: "destructive"
      });
    }
  }, [fetchTeams, toast]);

  return {
    teams,
    loading,
    submitting,
    fetchTeams,
    createTeam,
    joinTeam,
    leaveTeam
  };
};
