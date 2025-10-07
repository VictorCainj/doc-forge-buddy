/**
 * Exemplos Práticos de Uso do Sistema de Imagens HD
 * 
 * Este arquivo contém exemplos reais de como usar o sistema de imagens HD
 * em diferentes cenários do aplicativo.
 */

import { useState } from 'react';
import { 
  fileToBase64HD, 
  urlToBase64HD, 
  processMultipleImagesHD,
  optimizeForPrint,
  resizeForDocument,
  getImageInfo
} from '@/utils/imageHD';
import { ImageUploader } from '@/components/ImageUploader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ============================================
// EXEMPLO 1: Upload Simples com HD
// ============================================

export function ExemploUploadSimples() {
  const [imagemHD, setImagemHD] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    try {
      // Converter para HD automaticamente
      const base64HD = await fileToBase64HD(file);
      setImagemHD(base64HD);
      toast.success('Imagem convertida para HD!');
    } catch (error) {
      toast.error('Erro ao processar imagem');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upload com HD Automático</h2>
      
      <ImageUploader
        onUpload={handleUpload}
        maxSize={20 * 1024 * 1024} // 20MB
        maxWidth={7680} // 8K
        maxHeight={4320}
      />

      {imagemHD && (
        <div className="border rounded-lg p-4">
          <img src={imagemHD} alt="Preview HD" className="max-w-full h-auto" />
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 2: Processamento de Múltiplas Imagens
// ============================================

export function ExemploMultiplasImagens() {
  const [imagensHD, setImagensHD] = useState<Array<{ nome: string; base64: string }>>([]);
  const [processando, setProcessando] = useState(false);

  const handleMultipleUpload = async (files: File[]) => {
    setProcessando(true);
    
    try {
      // Processar todas as imagens em HD
      const resultado = await processMultipleImagesHD(files, {
        maxWidth: 2560,
        maxHeight: 1440,
        quality: 0.95,
      });

      setImagensHD(resultado);
      toast.success(`${resultado.length} imagens processadas em HD!`);
    } catch (error) {
      toast.error('Erro ao processar imagens');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Múltiplas Imagens HD</h2>
      
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleMultipleUpload(files);
        }}
        className="block w-full text-sm"
      />

      {processando && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Processando imagens HD...</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {imagensHD.map((img, idx) => (
          <div key={idx} className="border rounded-lg p-2">
            <img src={img.base64} alt={img.nome} className="w-full h-auto" />
            <p className="text-xs text-gray-600 mt-1 truncate">{img.nome}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 3: Otimização para Impressão
// ============================================

export function ExemploImpressao() {
  const [imagemPrint, setImagemPrint] = useState<string | null>(null);

  const handlePrintOptimization = async (file: File) => {
    try {
      // Otimizar para impressão (300 DPI)
      const printReady = await optimizeForPrint(file);
      setImagemPrint(printReady);
      toast.success('Imagem otimizada para impressão (300 DPI)!');
    } catch (error) {
      toast.error('Erro ao otimizar para impressão');
    }
  };

  const handlePrint = () => {
    if (imagemPrint) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Impressão HD</title>
              <style>
                body { margin: 0; padding: 20px; }
                img { 
                  max-width: 100%; 
                  height: auto;
                  image-rendering: -webkit-optimize-contrast;
                  image-rendering: crisp-edges;
                }
              </style>
            </head>
            <body>
              <img src="${imagemPrint}" alt="Imagem para impressão" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Otimização para Impressão</h2>
      
      <ImageUploader
        onUpload={handlePrintOptimization}
        maxSize={20 * 1024 * 1024}
      />

      {imagemPrint && (
        <div className="space-y-2">
          <div className="border rounded-lg p-4">
            <img src={imagemPrint} alt="Preview Impressão" className="max-w-full h-auto" />
          </div>
          <Button onClick={handlePrint} className="w-full">
            Imprimir (300 DPI)
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 4: Conversão de URL para HD
// ============================================

export function ExemploURLparaHD() {
  const [url, setUrl] = useState('');
  const [imagemHD, setImagemHD] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleConvert = async () => {
    if (!url) {
      toast.error('Digite uma URL válida');
      return;
    }

    setCarregando(true);
    
    try {
      // Converter URL para base64 HD
      const base64HD = await urlToBase64HD(url, {
        maxWidth: 2560,
        maxHeight: 1440,
        quality: 0.95,
      });

      setImagemHD(base64HD);
      toast.success('URL convertida para HD!');
    } catch (error) {
      toast.error('Erro ao converter URL. Verifique se a imagem permite CORS.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Converter URL para HD</h2>
      
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <Button onClick={handleConvert} disabled={carregando}>
          {carregando ? 'Convertendo...' : 'Converter'}
        </Button>
      </div>

      {imagemHD && (
        <div className="border rounded-lg p-4">
          <img src={imagemHD} alt="URL convertida" className="max-w-full h-auto" />
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 5: Informações da Imagem
// ============================================

export function ExemploInfoImagem() {
  const [info, setInfo] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
    size?: number;
  } | null>(null);

  const handleGetInfo = async (file: File) => {
    try {
      const imageInfo = await getImageInfo(file);
      setInfo(imageInfo);
      
      toast.success(
        `Imagem: ${imageInfo.width}x${imageInfo.height} (${imageInfo.aspectRatio.toFixed(2)}:1)`
      );
    } catch (error) {
      toast.error('Erro ao obter informações da imagem');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Informações da Imagem</h2>
      
      <ImageUploader onUpload={handleGetInfo} />

      {info && (
        <div className="border rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Largura</p>
              <p className="text-lg font-semibold">{info.width}px</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Altura</p>
              <p className="text-lg font-semibold">{info.height}px</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Proporção</p>
              <p className="text-lg font-semibold">{info.aspectRatio.toFixed(2)}:1</p>
            </div>
            {info.size && (
              <div>
                <p className="text-sm text-gray-600">Tamanho</p>
                <p className="text-lg font-semibold">
                  {(info.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 6: Redimensionamento Personalizado
// ============================================

export function ExemploRedimensionamento() {
  const [largura, setLargura] = useState(1920);
  const [altura, setAltura] = useState(1080);
  const [imagemRedimensionada, setImagemRedimensionada] = useState<string | null>(null);

  const handleResize = async (file: File) => {
    try {
      const resized = await resizeForDocument(file, largura, altura);
      setImagemRedimensionada(resized);
      toast.success(`Imagem redimensionada para ${largura}x${altura}!`);
    } catch (error) {
      toast.error('Erro ao redimensionar imagem');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Redimensionamento Personalizado</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Largura (px)</label>
          <input
            type="number"
            value={largura}
            onChange={(e) => setLargura(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Altura (px)</label>
          <input
            type="number"
            value={altura}
            onChange={(e) => setAltura(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <ImageUploader onUpload={handleResize} />

      {imagemRedimensionada && (
        <div className="border rounded-lg p-4">
          <img 
            src={imagemRedimensionada} 
            alt="Redimensionada" 
            className="max-w-full h-auto"
          />
          <p className="text-sm text-gray-600 mt-2">
            Redimensionada para {largura}x{altura}px com qualidade HD
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 7: Comparação Antes/Depois
// ============================================

export function ExemploComparacao() {
  const [original, setOriginal] = useState<string | null>(null);
  const [hd, setHD] = useState<string | null>(null);
  const [tamanhoOriginal, setTamanhoOriginal] = useState(0);
  const [tamanhoHD, setTamanhoHD] = useState(0);

  const handleCompare = async (file: File) => {
    // Original
    const readerOriginal = new FileReader();
    readerOriginal.onload = () => {
      setOriginal(readerOriginal.result as string);
      setTamanhoOriginal(file.size);
    };
    readerOriginal.readAsDataURL(file);

    // HD
    try {
      const base64HD = await fileToBase64HD(file);
      setHD(base64HD);
      
      // Calcular tamanho do base64
      const base64Length = base64HD.split(',')[1].length;
      const tamanhoBytes = (base64Length * 3) / 4;
      setTamanhoHD(tamanhoBytes);

      toast.success('Comparação gerada!');
    } catch (error) {
      toast.error('Erro ao processar imagem HD');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Comparação Antes/Depois</h2>
      
      <ImageUploader onUpload={handleCompare} />

      {original && hd && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Original</h3>
            <img src={original} alt="Original" className="w-full h-auto mb-2" />
            <p className="text-sm text-gray-600">
              Tamanho: {(tamanhoOriginal / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">HD (2560x1440, 95%)</h3>
            <img src={hd} alt="HD" className="w-full h-auto mb-2" />
            <p className="text-sm text-gray-600">
              Tamanho: {(tamanhoHD / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PÁGINA DE DEMONSTRAÇÃO COMPLETA
// ============================================

export default function ImageHDExamplesPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Exemplos de Imagens HD</h1>
        <p className="text-gray-600">
          Demonstrações práticas do sistema de imagens em alta definição
        </p>
      </div>

      <div className="space-y-8">
        <ExemploUploadSimples />
        <hr />
        <ExemploMultiplasImagens />
        <hr />
        <ExemploImpressao />
        <hr />
        <ExemploURLparaHD />
        <hr />
        <ExemploInfoImagem />
        <hr />
        <ExemploRedimensionamento />
        <hr />
        <ExemploComparacao />
      </div>
    </div>
  );
}
