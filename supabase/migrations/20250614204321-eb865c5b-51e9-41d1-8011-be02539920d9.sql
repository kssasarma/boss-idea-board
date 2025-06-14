
-- Enable Row Level Security on the likes table (if not already enabled)
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can view all likes') THEN
        CREATE POLICY "Users can view all likes" 
          ON public.likes 
          FOR SELECT 
          USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can create likes') THEN
        CREATE POLICY "Users can create likes" 
          ON public.likes 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can delete their own likes') THEN
        CREATE POLICY "Users can delete their own likes" 
          ON public.likes 
          FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable Row Level Security on the comments table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can view all comments') THEN
        CREATE POLICY "Users can view all comments" 
          ON public.comments 
          FOR SELECT 
          USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can create comments') THEN
        CREATE POLICY "Users can create comments" 
          ON public.comments 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
        CREATE POLICY "Users can update their own comments" 
          ON public.comments 
          FOR UPDATE 
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
        CREATE POLICY "Users can delete their own comments" 
          ON public.comments 
          FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable Row Level Security on the ideas table
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Create policies for ideas table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ideas' AND policyname = 'Users can view all ideas') THEN
        CREATE POLICY "Users can view all ideas" 
          ON public.ideas 
          FOR SELECT 
          USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ideas' AND policyname = 'Users can create ideas') THEN
        CREATE POLICY "Users can create ideas" 
          ON public.ideas 
          FOR INSERT 
          WITH CHECK (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ideas' AND policyname = 'Users can update their own ideas or admins can update any') THEN
        CREATE POLICY "Users can update their own ideas or admins can update any" 
          ON public.ideas 
          FOR UPDATE 
          USING (auth.uid() = created_by OR is_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ideas' AND policyname = 'Users can delete their own ideas or admins can delete any') THEN
        CREATE POLICY "Users can delete their own ideas or admins can delete any" 
          ON public.ideas 
          FOR DELETE 
          USING (auth.uid() = created_by OR is_admin(auth.uid()));
    END IF;
END $$;
