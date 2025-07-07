-- Add social media features to posts
-- Add upvotes table
CREATE TABLE public.post_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_session TEXT NOT NULL, -- Using session ID instead of user auth for now
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_session)
);

-- Add comments table  
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add reports table
CREATE TABLE public.post_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  user_session TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_session)
);

-- Enable RLS on all new tables
ALTER TABLE public.post_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view upvotes" ON public.post_upvotes FOR SELECT USING (true);
CREATE POLICY "Anyone can create upvotes" ON public.post_upvotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete their upvotes" ON public.post_upvotes FOR DELETE USING (true);

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.post_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create reports" ON public.post_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view reports" ON public.post_reports FOR SELECT USING (true);