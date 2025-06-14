
-- Create a profiles table to store user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create admin role enum and user_roles table for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Insert admin role for the specified email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'kssasarma@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for ideas table that allow admin full control
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view ideas
CREATE POLICY "Anyone can view ideas" ON public.ideas
  FOR SELECT USING (true);

-- Allow authenticated users to create ideas
CREATE POLICY "Authenticated users can create ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own ideas or admins to update any idea
CREATE POLICY "Users can update their own ideas or admins can update any" ON public.ideas
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    public.is_admin(auth.uid())
  );

-- Allow users to delete their own ideas or admins to delete any idea
CREATE POLICY "Users can delete their own ideas or admins can delete any" ON public.ideas
  FOR DELETE USING (
    auth.uid() = created_by OR 
    public.is_admin(auth.uid())
  );

-- Add RLS policies for other tables
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own comments or admins can update any" ON public.comments
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );
CREATE POLICY "Users can delete their own comments or admins can delete any" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );

ALTER TABLE public.idea_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscriptions" ON public.idea_subscriptions
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.idea_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view idea activity" ON public.idea_activity
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create activity logs" ON public.idea_activity
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.idea_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view dependencies" ON public.idea_dependencies
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create dependencies" ON public.idea_dependencies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update dependencies they created or admins can update any" ON public.idea_dependencies
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    public.is_admin(auth.uid())
  );
CREATE POLICY "Users can delete dependencies they created or admins can delete any" ON public.idea_dependencies
  FOR DELETE USING (
    auth.uid() = created_by OR 
    public.is_admin(auth.uid())
  );
