-- Create table for contracts
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_contrato TEXT NOT NULL,
  nome_locatario TEXT NOT NULL,
  endereco_imovel TEXT NOT NULL,
  nome_proprietario TEXT NOT NULL,
  email_proprietario TEXT NOT NULL,
  data_comunicacao TEXT NOT NULL,
  data_inicio_desocupacao TEXT NOT NULL,
  data_termino_desocupacao TEXT NOT NULL,
  prazo_dias TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_contracts_numero_contrato ON public.contracts(numero_contrato);
CREATE INDEX idx_contracts_nome_locatario ON public.contracts(nome_locatario);
CREATE INDEX idx_contracts_created_at ON public.contracts(created_at DESC);

-- Create trigger for updating updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Allow read access to all rows
CREATE POLICY "Allow read access to contracts" 
ON public.contracts 
FOR SELECT 
USING (true);

-- Allow insert access to all rows
CREATE POLICY "Allow insert access to contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (true);

-- Allow update access to all rows
CREATE POLICY "Allow update access to contracts" 
ON public.contracts 
FOR UPDATE 
USING (true);

-- Allow delete access to all rows
CREATE POLICY "Allow delete access to contracts" 
ON public.contracts 
FOR DELETE 
USING (true);
