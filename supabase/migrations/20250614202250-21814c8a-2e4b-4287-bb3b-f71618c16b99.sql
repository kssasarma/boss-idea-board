
-- Create a table to store email notification preferences
CREATE TABLE public.email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  notification_types TEXT[] DEFAULT ARRAY['status_change', 'comments', 'updates'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for email preferences
CREATE POLICY "Users can view their own email preferences" 
  ON public.email_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email preferences" 
  ON public.email_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" 
  ON public.email_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email preferences" 
  ON public.email_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to send notification emails
CREATE OR REPLACE FUNCTION public.send_idea_notification_email(
  p_user_id UUID,
  p_idea_id UUID,
  p_subject TEXT,
  p_message TEXT,
  p_notification_type TEXT DEFAULT 'general'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  user_email TEXT;
  idea_title TEXT;
BEGIN
  -- Get user email and idea title
  SELECT email INTO user_email 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  SELECT title INTO idea_title 
  FROM public.ideas 
  WHERE id = p_idea_id;
  
  -- Create notification record
  SELECT create_notification(
    p_user_id, 
    p_idea_id, 
    p_subject, 
    p_message, 
    p_notification_type
  ) INTO notification_id;
  
  -- Note: In a real implementation, you would call an edge function here
  -- to actually send the email using a service like Resend
  
  RETURN notification_id;
END;
$$;

-- Create trigger function for idea updates
CREATE OR REPLACE FUNCTION public.notify_idea_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscriber_record RECORD;
  notification_type TEXT;
  subject_text TEXT;
  message_text TEXT;
BEGIN
  -- Determine notification type and message based on what changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    notification_type := 'status_change';
    subject_text := 'Idea Status Updated: ' || NEW.title;
    message_text := 'The status of idea "' || NEW.title || '" has been changed from "' || OLD.status || '" to "' || NEW.status || '".';
  ELSIF OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage THEN
    notification_type := 'updates';
    subject_text := 'Idea Progress Updated: ' || NEW.title;
    message_text := 'The progress of idea "' || NEW.title || '" has been updated to ' || NEW.progress_percentage || '%.';
  ELSE
    notification_type := 'updates';
    subject_text := 'Idea Updated: ' || NEW.title;
    message_text := 'The idea "' || NEW.title || '" has been updated.';
  END IF;

  -- Send notifications to all subscribers
  FOR subscriber_record IN
    SELECT DISTINCT ep.user_id, ep.notification_types
    FROM public.email_preferences ep
    JOIN public.idea_subscriptions sub ON sub.user_id = ep.user_id AND sub.idea_id = ep.idea_id
    WHERE ep.idea_id = NEW.id 
    AND ep.is_active = true
    AND notification_type = ANY(ep.notification_types)
    AND ep.user_id != NEW.created_by  -- Don't notify the person who made the change
  LOOP
    PERFORM send_idea_notification_email(
      subscriber_record.user_id,
      NEW.id,
      subject_text,
      message_text,
      notification_type
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for idea updates
CREATE TRIGGER trigger_notify_idea_subscribers
  AFTER UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION notify_idea_subscribers();

-- Create trigger function for new comments
CREATE OR REPLACE FUNCTION public.notify_comment_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscriber_record RECORD;
  idea_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get idea title
  SELECT title INTO idea_title FROM public.ideas WHERE id = NEW.idea_id;
  
  -- Get commenter name
  SELECT COALESCE(full_name, email) INTO commenter_name 
  FROM public.profiles WHERE id = NEW.user_id;

  -- Send notifications to subscribers who want comment notifications
  FOR subscriber_record IN
    SELECT DISTINCT ep.user_id
    FROM public.email_preferences ep
    JOIN public.idea_subscriptions sub ON sub.user_id = ep.user_id AND sub.idea_id = ep.idea_id
    WHERE ep.idea_id = NEW.idea_id 
    AND ep.is_active = true
    AND 'comments' = ANY(ep.notification_types)
    AND ep.user_id != NEW.user_id  -- Don't notify the commenter
  LOOP
    PERFORM send_idea_notification_email(
      subscriber_record.user_id,
      NEW.idea_id,
      'New Comment on: ' || idea_title,
      commenter_name || ' has commented on the idea "' || idea_title || '": ' || LEFT(NEW.text, 100) || '...',
      'comments'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new comments
CREATE TRIGGER trigger_notify_comment_subscribers
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_subscribers();
