# 🎨 Guia Rápido: Imagens em HD

## 📸 Como Usar

### **1. Upload de Imagens**

Todas as imagens carregadas no sistema agora suportam **HD automático**:

```tsx
// Componente já configurado para HD
<ImageUploader
  onUpload={handleUpload}
  // Aceita até 20MB e 8K automaticamente
/>
```

**Limites:**
- ✅ Tamanho: até **20MB**
- ✅ Resolução: até **8K (7680x4320)**
- ✅ Formatos: JPEG, PNG, WEBP
- ✅ Compressão automática: > 2MB

---

### **2. Processamento para Documentos**

#### Opção 1: Conversão HD Automática
```typescript
import { fileToBase64HD } from '@/utils/imageHD';

const base64HD = await fileToBase64HD(file);
// Resultado: 2560x1440, qualidade 95%
```

#### Opção 2: Configuração Personalizada
```typescript
const base64HD = await fileToBase64HD(file, {
  maxWidth: 3840,    // 4K
  maxHeight: 2160,
  quality: 0.98,     // 98%
  format: 'jpeg',
});
```

#### Opção 3: Otimização para Impressão
```typescript
import { optimizeForPrint } from '@/utils/imageHD';

const printReady = await optimizeForPrint(file);
// Resultado: 300 DPI, qualidade 98%
```

---

### **3. Múltiplas Imagens**

```typescript
import { processMultipleImagesHD } from '@/utils/imageHD';

const imagesHD = await processMultipleImagesHD(files, {
  maxWidth: 2560,
  maxHeight: 1440,
  quality: 0.95,
});
```

---

### **4. Renderização no HTML**

#### Imagens Nítidas (Logos, Ícones)
```html
<img 
  src="..." 
  alt="Logo"
  style="image-rendering: crisp-edges;"
/>
```

#### Fotos Suaves (Retratos, Paisagens)
```html
<img 
  src="..." 
  alt="Foto"
  data-smooth="true"
/>
```

---

## 🎯 Casos de Uso

### **Análise de Vistoria**
```typescript
// Já implementado automaticamente
// Todas as fotos são convertidas para HD
const template = await ANALISE_VISTORIA_TEMPLATE({
  apontamentos: [
    {
      vistoriaInicial: {
        fotos: [file1, file2], // Convertidos para HD
      },
      vistoriaFinal: {
        fotos: [file3, file4], // Convertidos para HD
      },
    },
  ],
});
```

### **Templates de Documentos**
```html
<!-- Logo em HD (já implementado) -->
<img 
  src="https://i.imgur.com/jSbw2Ec.jpeg" 
  alt="Logo" 
  style="
    height: 150px; 
    width: auto; 
    image-rendering: crisp-edges;
  " 
/>
```

### **Galeria de Imagens**
```tsx
// Componente já otimizado
<ImageGalleryModal
  images={images}
  // Zoom mantém qualidade HD
/>
```

---

## 🔧 Configurações Padrão

### **Interface (useOptimizedImages)**
```typescript
{
  maxWidth: 2560,      // QHD
  maxHeight: 1440,
  quality: 0.95,       // 95%
  maxSizeKB: 2048,     // 2MB
}
```

### **Validação (imageValidation)**
```typescript
{
  maxSize: 20MB,       // 20MB
  maxWidth: 7680,      // 8K
  maxHeight: 4320,
  quality: 0.95,       // 95%
}
```

### **Documentos (imageHD)**
```typescript
{
  maxWidth: 2560,      // QHD
  maxHeight: 1440,
  quality: 0.95,       // 95%
  format: 'jpeg',
}
```

---

## 🎨 CSS Global

### **Aplicado Automaticamente**
```css
/* Todas as imagens */
img {
  image-rendering: crisp-edges;
}

/* Exceção para fotos suaves */
img[data-smooth="true"] {
  image-rendering: auto;
}

/* Impressão */
@media print {
  img {
    image-rendering: crisp-edges;
    print-color-adjust: exact;
  }
}
```

---

## 📊 Qualidade Visual

### **Antes vs Depois**

| Tipo | Antes | Depois |
|------|-------|--------|
| **Interface** | 1920x1080, 80% | 2560x1440, 95% |
| **Documentos** | Sem otimização | 2560x1440, 95% |
| **Impressão** | Padrão | 300 DPI, 98% |
| **Zoom** | Pixelado | Nítido |

---

## ⚡ Performance

### **Otimizações Automáticas**
- ✅ Compressão inteligente (> 2MB)
- ✅ Processamento assíncrono
- ✅ Cache de canvas
- ✅ Batch processing
- ✅ Fallback gracioso

### **Tempo de Processamento**
- 📷 Imagem única: ~200ms
- 📷 5 imagens: ~1s
- 📷 10 imagens: ~2s

---

## 🚨 Troubleshooting

### **Imagem não carrega**
```typescript
// Verificar se é URL válida
import { isImageUrl } from '@/utils/imageHD';

if (!isImageUrl(url)) {
  console.error('URL inválida');
}
```

### **Qualidade baixa**
```typescript
// Aumentar qualidade manualmente
const hd = await fileToBase64HD(file, {
  quality: 0.98, // Aumentar para 98%
});
```

### **Arquivo muito grande**
```typescript
// Reduzir resolução
const hd = await fileToBase64HD(file, {
  maxWidth: 1920,
  maxHeight: 1080,
});
```

---

## 📱 Responsividade

### **Adaptação Automática**
```typescript
const isMobile = window.innerWidth < 768;

const options = {
  maxWidth: isMobile ? 1920 : 2560,
  maxHeight: isMobile ? 1080 : 1440,
  quality: 0.95,
};
```

---

## ✅ Checklist de Qualidade

Ao trabalhar com imagens:

- [ ] Upload aceita até 20MB?
- [ ] Resolução máxima 8K?
- [ ] Compressão > 2MB ativa?
- [ ] Qualidade 95%+?
- [ ] Renderização HD no CSS?
- [ ] Fallback para erros?
- [ ] Performance < 1s?
- [ ] Compatibilidade cross-browser?

---

## 🔗 Links Úteis

- [Documentação Completa](./HD_IMAGES_IMPLEMENTATION.md)
- [Utilitário imageHD.ts](./src/utils/imageHD.ts)
- [Hook useOptimizedImages](./src/hooks/useOptimizedImages.ts)
- [Validação de Imagens](./src/utils/imageValidation.ts)

---

**Última atualização**: 2025-10-06  
**Versão**: 1.0.0
