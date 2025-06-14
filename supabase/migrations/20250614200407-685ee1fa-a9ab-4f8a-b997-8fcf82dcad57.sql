
-- Add status and progress tracking to ideas table
ALTER TABLE public.ideas 
ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'in_progress', 'completed', 'cancelled', 'on_hold')),
ADD COLUMN priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN assigned_to UUID[] DEFAULT '{}',
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create idea dependencies table
CREATE TABLE public.idea_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  depends_on_idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'requires', 'relates_to')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  UNIQUE(idea_id, depends_on_idea_id)
);

-- Create subscriptions table for notifications
CREATE TABLE public.idea_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  subscription_type TEXT DEFAULT 'all' CHECK (subscription_type IN ('all', 'status_changes', 'comments', 'progress_updates')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, idea_id, subscription_type)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activity log table for collaboration tracking
CREATE TABLE public.idea_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'status_changed', 'progress_updated', 'commented', 'liked', 'assigned', 'dependency_added')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for new tables
ALTER TABLE public.idea_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_activity ENABLE ROW LEVEL SECURITY;

-- Policies for idea_dependencies
CREATE POLICY "Everyone can view idea dependencies" ON public.idea_dependencies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create dependencies" ON public.idea_dependencies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update dependencies they created" ON public.idea_dependencies FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete dependencies they created" ON public.idea_dependencies FOR DELETE USING (created_by = auth.uid());

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.idea_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own subscriptions" ON public.idea_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own subscriptions" ON public.idea_subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own subscriptions" ON public.idea_subscriptions FOR DELETE USING (user_id = auth.uid());

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Policies for activity log
CREATE POLICY "Everyone can view idea activity" ON public.idea_activity FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create activity logs" ON public.idea_activity FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable real-time for new tables
ALTER TABLE public.idea_dependencies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_dependencies;

ALTER TABLE public.idea_subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_subscriptions;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.idea_activity REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_activity;

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_idea_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, idea_id, title, message, type)
  VALUES (p_user_id, p_idea_id, p_title, p_message, p_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_idea_activity(
  p_idea_id UUID,
  p_user_id UUID,
  p_action_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.idea_activity (idea_id, user_id, action_type, description, metadata)
  VALUES (p_idea_id, p_user_id, p_action_type, p_description, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
