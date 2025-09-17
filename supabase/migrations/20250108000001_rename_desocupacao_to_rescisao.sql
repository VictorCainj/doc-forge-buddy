-- Rename columns from desocupacao to rescisao
ALTER TABLE public.contracts 
RENAME COLUMN data_inicio_desocupacao TO data_inicio_rescisao;

ALTER TABLE public.contracts 
RENAME COLUMN data_termino_desocupacao TO data_termino_rescisao;
