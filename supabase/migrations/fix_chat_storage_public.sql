-- Garantir que o bucket chat-images seja público
UPDATE storage.buckets
SET public = true
WHERE id = 'chat-images';

-- Se o bucket não existir, criar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Verificar se foi atualizado
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'chat-images';
