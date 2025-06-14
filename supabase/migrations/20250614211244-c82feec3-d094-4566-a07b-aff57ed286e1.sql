
-- Create table for project volunteers
CREATE TABLE public.idea_volunteers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(idea_id, user_id)
);

-- Create table for teams
CREATE TABLE public.idea_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.idea_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create table for GitLab integration
CREATE TABLE public.idea_gitlab_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  gitlab_project_id TEXT NOT NULL,
  gitlab_project_url TEXT NOT NULL,
  access_token_encrypted TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  total_issues INTEGER DEFAULT 0,
  closed_issues INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.idea_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_gitlab_integration ENABLE ROW LEVEL SECURITY;

-- RLS policies for idea_volunteers
CREATE POLICY "Anyone can view volunteers for ideas they can see"
  ON public.idea_volunteers FOR SELECT
  USING (true);

CREATE POLICY "Users can volunteer for ideas"
  ON public.idea_volunteers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own volunteer applications"
  ON public.idea_volunteers FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT created_by FROM public.ideas WHERE id = idea_id
  ));

-- RLS policies for idea_teams
CREATE POLICY "Anyone can view teams for ideas they can see"
  ON public.idea_teams FOR SELECT
  USING (true);

CREATE POLICY "Idea creators and admins can manage teams"
  ON public.idea_teams FOR ALL
  USING (auth.uid() IN (
    SELECT created_by FROM public.ideas WHERE id = idea_id
  ) OR public.is_admin(auth.uid()));

-- RLS policies for team_members
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "Team leaders and idea creators can manage team members"
  ON public.team_members FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members tm2 
      WHERE tm2.team_id = team_id AND tm2.role = 'leader'
    ) OR
    auth.uid() IN (
      SELECT i.created_by FROM public.ideas i 
      JOIN public.idea_teams it ON it.idea_id = i.id 
      WHERE it.id = team_id
    ) OR
    public.is_admin(auth.uid())
  );

-- RLS policies for GitLab integration
CREATE POLICY "Anyone can view GitLab integration for ideas they can see"
  ON public.idea_gitlab_integration FOR SELECT
  USING (true);

CREATE POLICY "Idea creators and admins can manage GitLab integration"
  ON public.idea_gitlab_integration FOR ALL
  USING (auth.uid() IN (
    SELECT created_by FROM public.ideas WHERE id = idea_id
  ) OR public.is_admin(auth.uid()));

-- Function to update idea progress based on GitLab issues
CREATE OR REPLACE FUNCTION public.update_idea_progress_from_gitlab(p_idea_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  gitlab_data RECORD;
  new_progress INTEGER;
BEGIN
  -- Get GitLab data for the idea
  SELECT total_issues, closed_issues INTO gitlab_data
  FROM public.idea_gitlab_integration
  WHERE idea_id = p_idea_id;
  
  IF gitlab_data.total_issues > 0 THEN
    -- Calculate progress percentage
    new_progress := ROUND((gitlab_data.closed_issues::DECIMAL / gitlab_data.total_issues::DECIMAL) * 100);
    
    -- Update the idea's progress
    UPDATE public.ideas
    SET progress_percentage = new_progress,
        updated_at = now()
    WHERE id = p_idea_id;
    
    -- Log the activity
    INSERT INTO public.idea_activity (idea_id, user_id, action_type, description)
    VALUES (
      p_idea_id,
      (SELECT created_by FROM public.ideas WHERE id = p_idea_id),
      'gitlab_sync',
      'Progress updated from GitLab: ' || new_progress || '% (' || gitlab_data.closed_issues || '/' || gitlab_data.total_issues || ' issues completed)'
    );
  END IF;
END;
$$;

-- Function to sync GitLab issues (placeholder for edge function)
CREATE OR REPLACE FUNCTION public.sync_gitlab_issues(p_idea_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- This will be implemented in an edge function
  -- For now, return a placeholder response
  result := jsonb_build_object(
    'success', false,
    'message', 'GitLab sync edge function not implemented yet'
  );
  
  RETURN result;
END;
$$;
