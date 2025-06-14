
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Volunteer {
  id: string;
  idea_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  skills: string[];
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export const useVolunteers = (ideaId: string) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: volunteersData, error: volunteersError } = await supabase
        .from('idea_volunteers')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (volunteersError) throw volunteersError;

      // Get unique user IDs from volunteers
      const userIds = [...new Set(volunteersData?.map(v => v.user_id).filter(Boolean) || [])];

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

      // Normalize status and skills for type correctness
      const volunteersWithProfiles = (volunteersData || []).map((volunteer: any) => {
        // Normalize status
        let status: 'approved' | 'rejected' | 'pending' = 'pending';
        if (volunteer.status === 'approved') status = 'approved';
        else if (volunteer.status === 'rejected') status = 'rejected';

        // Normalize skills
        let skills: string[] = [];
        if (Array.isArray(volunteer.skills)) {
          // If already an array, filter to string elements
          skills = volunteer.skills.filter((s: any) => typeof s === 'string');
        } else if (typeof volunteer.skills === 'string') {
          try {
            const parsed = JSON.parse(volunteer.skills);
            if (Array.isArray(parsed)) {
              skills = parsed.filter((s: any) => typeof s === 'string');
            }
          } catch {
            // leave skills as empty []
          }
        }

        // fallback: treat null/undefined/anything else as empty array

        return {
          ...volunteer,
          status,
          skills,
          profile: profilesMap.get(volunteer.user_id),
        };
      });

      setVolunteers(volunteersWithProfiles);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch volunteers",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [ideaId, toast]);

  const submitVolunteerApplication = useCallback(async (
    message: string, 
    skills: string[]
  ) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('idea_volunteers')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          message: message.trim() || null,
          skills: skills
        });

      if (error) throw error;

      await fetchVolunteers();
      
      toast({
        title: "Success",
        description: "Volunteer application submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting volunteer application:', error);
      toast({
        title: "Error",
        description: "Failed to submit volunteer application",
        variant: "destructive"
      });
    }
    setSubmitting(false);
  }, [ideaId, fetchVolunteers, toast]);

  const updateVolunteerStatus = useCallback(async (
    volunteerId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('idea_volunteers')
        .update({
          status,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', volunteerId);

      if (error) throw error;

      await fetchVolunteers();
      
      toast({
        title: "Success",
        description: `Volunteer application ${status} successfully`
      });
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      toast({
        title: "Error",
        description: "Failed to update volunteer status",
        variant: "destructive"
      });
    }
  }, [fetchVolunteers, toast]);

  // NEW: Remove a volunteer (delete their application from this idea)
  const removeVolunteer = useCallback(async (volunteerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('idea_volunteers')
        .delete()
        .eq('id', volunteerId);

      if (error) throw error;

      await fetchVolunteers();

      toast({
        title: "Volunteer removed",
        description: "Volunteer application has been removed successfully."
      });
    } catch (error) {
      console.error('Error removing volunteer:', error);
      toast({
        title: "Error",
        description: "Failed to remove volunteer.",
        variant: "destructive"
      });
    }
  }, [fetchVolunteers, toast]);

  return {
    volunteers,
    loading,
    submitting,
    fetchVolunteers,
    submitVolunteerApplication,
    updateVolunteerStatus,
    removeVolunteer, // added this
  };
};
