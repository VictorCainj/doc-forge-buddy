# Guia de Ícones PWA

## ⚠️ Importante: Geração de Ícones

O ícone principal (512x512) foi gerado automaticamente. Para os ícones menores, você pode:

### Opção 1: Redimensionar Manualmente (Recomendado)

Use ferramentas como:
- **ImageMagick**: `convert icon-512x512.png -resize 192x192 icon-192x192.png`
- **Photoshop/GIMP**: Redimensionar com qualidade alta
- **Online**: https://www.iloveimg.com/resize-image

Tamanhos necessários:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512 ✅ (já gerado)

### Opção 2: Usar Gerador Online de Ícones PWA

- **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
  ```bash
  npx pwa-asset-generator public/icon-512x512.png public --icon-only
  ```

- **RealFaviconGenerator**: https://realfavicongenerator.net/
  - Upload do icon-512x512.png
  - Gera todos os tamanhos automaticamente
  - Baixa um pacote ZIP com todos os ícones

### Opção 3: Usar o Ícone de 512px para Todos

Por enquanto, o manifest está configurado para usar o ícone de 512x512. Os navegadores irão redimensionar automaticamente conforme necessário. Esta é uma solução temporária mas funcional.

## 🎨 Especificações do Ícone

- **Formato**: PNG (com transparência ou fundo sólido)
- **Proporção**: 1:1 (quadrado)
- **Cores**: Gradiente azul (#1e40af para tons mais claros)
- **Estilo**: Moderno, minimalista, profissional
- **Conteúdo**: Documento/contrato + elemento visual (maleta, martelo, etc.)

## 📱 Testes de Ícones

Após gerar todos os ícones, teste em:
1. Chrome DevTools > Application > Manifest
2. Instale o PWA e verifique o ícone na tela inicial
3. Teste em diferentes dispositivos (Android, iOS)

## 🔄 Atualização de Ícones

Quando atualizar os ícones:
1. Substitua os arquivos em `/public/`
2. Limpe o cache do navegador
3. Desinstale e reinstale o PWA para ver as mudanças
