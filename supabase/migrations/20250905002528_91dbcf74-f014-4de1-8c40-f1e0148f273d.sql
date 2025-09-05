-- Create table for saved terms
CREATE TABLE public.saved_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  form_data JSONB NOT NULL,
  document_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search index for better performance
CREATE INDEX idx_saved_terms_document_type ON public.saved_terms(document_type);
CREATE INDEX idx_saved_terms_title ON public.saved_terms(title);
CREATE INDEX idx_saved_terms_created_at ON public.saved_terms(created_at DESC);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_terms_updated_at
  BEFORE UPDATE ON public.saved_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();