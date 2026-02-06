-- Create reviews table for volunteer ratings and feedback
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate reviews for the same match
  CONSTRAINT unique_review_per_match UNIQUE (reviewer_id, reviewed_id, match_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see reviews)
CREATE POLICY "Reviews are publicly readable"
ON public.reviews
FOR SELECT
USING (true);

-- Only the reviewer can create reviews
CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = reviews.reviewer_id
    AND profiles.user_id = auth.uid()
  )
);

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews"
ON public.reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = reviews.reviewer_id
    AND profiles.user_id = auth.uid()
  )
);

-- Reviewers can delete their own reviews
CREATE POLICY "Reviewers can delete own reviews"
ON public.reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = reviews.reviewer_id
    AND profiles.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);