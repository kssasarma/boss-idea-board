
-- Enable RLS on all tables
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for ideas table
CREATE POLICY "Anyone can view ideas" ON public.ideas
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ideas" ON public.ideas
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own ideas" ON public.ideas
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own ideas" ON public.ideas
    FOR DELETE USING (auth.uid() = created_by);

-- Create policies for comments table
CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for likes table
CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create unique constraint for likes to prevent multiple likes from same user
ALTER TABLE public.likes ADD CONSTRAINT unique_user_idea_like UNIQUE (user_id, idea_id);

-- Create foreign key relationships
ALTER TABLE public.ideas ADD CONSTRAINT fk_ideas_created_by 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.comments ADD CONSTRAINT fk_comments_idea_id 
    FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;

ALTER TABLE public.comments ADD CONSTRAINT fk_comments_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.likes ADD CONSTRAINT fk_likes_idea_id 
    FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;

ALTER TABLE public.likes ADD CONSTRAINT fk_likes_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_ideas_created_by ON public.ideas(created_by);
CREATE INDEX idx_ideas_business_unit ON public.ideas(business_unit);
CREATE INDEX idx_comments_idea_id ON public.comments(idea_id);
CREATE INDEX idx_likes_idea_id ON public.likes(idea_id);
