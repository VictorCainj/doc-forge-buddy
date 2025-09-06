-- Enable Row Level Security on saved_terms table
ALTER TABLE public.saved_terms ENABLE ROW LEVEL SECURITY;

-- Allow read access to all rows (documents can be viewed by anyone)
CREATE POLICY "Allow read access to saved_terms" 
ON public.saved_terms 
FOR SELECT 
USING (true);

-- Allow insert access to all rows (anyone can save documents)
CREATE POLICY "Allow insert access to saved_terms" 
ON public.saved_terms 
FOR INSERT 
WITH CHECK (true);

-- Allow update access to all rows (anyone can update documents)
CREATE POLICY "Allow update access to saved_terms" 
ON public.saved_terms 
FOR UPDATE 
USING (true);

-- Allow delete access to all rows (anyone can delete documents)
CREATE POLICY "Allow delete access to saved_terms" 
ON public.saved_terms 
FOR DELETE 
USING (true);