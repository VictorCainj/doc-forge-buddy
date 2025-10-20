-- MIGRATION MANUAL - Execute diretamente no Supabase Dashboard
-- Adicionar coluna image_serial na tabela vistoria_images

-- 1. Adicionar a nova coluna
ALTER TABLE vistoria_images 
ADD COLUMN image_serial TEXT;

-- 2. Criar índice para melhor performance nas consultas
CREATE INDEX idx_vistoria_images_serial ON vistoria_images(image_serial);

-- 3. Adicionar constraint UNIQUE para prevenir duplicações
-- A combinação deve ser única: vistoria_id + apontamento_id + tipo_vistoria + image_serial
ALTER TABLE vistoria_images 
ADD CONSTRAINT unique_image_serial_per_apontamento 
UNIQUE (vistoria_id, apontamento_id, tipo_vistoria, image_serial);

-- 4. Comentário explicativo
COMMENT ON COLUMN vistoria_images.image_serial IS 'Número de série único para cada imagem, formato: V{vistoria_id}-A{apontamento_index}-{tipo}-{index}';
