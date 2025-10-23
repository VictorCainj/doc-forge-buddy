/**
 * Teste para verificar se os botões de exclusão estão sendo adicionados corretamente
 */

describe('DocumentViewer Image Delete', () => {
  test('deve adicionar botões de exclusão nas imagens', () => {
    const htmlWithImages = `
      <div>
        <h1>Documento de Teste</h1>
        <img src="https://example.com/image1.jpg" alt="Imagem 1" />
        <p>Texto entre imagens</p>
        <img src="https://example.com/image2.jpg" alt="Imagem 2" />
      </div>
    `;

    // Simular o processamento do HTML
    const processedHTML = htmlWithImages.replace(
      /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        const escapedSrc = src.replace(/'/g, "\\'");
        return `
          <div class="image-container" style="position: relative; display: inline-block;">
            <img${before}src="${src}"${after}>
            <button 
              class="image-delete-overlay" 
              onclick="window.handleImageDelete && window.handleImageDelete('${escapedSrc}')"
              title="Excluir imagem"
              style="position: absolute; top: 5px; right: 5px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; opacity: 0.7; transition: opacity 0.2s ease; z-index: 1001;"
              onmouseover="this.style.opacity='1'"
              onmouseout="this.style.opacity='0.7'"
            >
              ×
            </button>
          </div>
        `;
      }
    );

    // Verificar se os botões foram adicionados
    expect(processedHTML).toContain('image-container');
    expect(processedHTML).toContain('image-delete-overlay');
    expect(processedHTML).toContain('window.handleImageDelete');
    expect(processedHTML).toContain('https://example.com/image1.jpg');
    expect(processedHTML).toContain('https://example.com/image2.jpg');

    // Verificar se as imagens originais ainda estão lá
    expect(processedHTML).toContain(
      '<img src="https://example.com/image1.jpg" alt="Imagem 1" />'
    );
    expect(processedHTML).toContain(
      '<img src="https://example.com/image2.jpg" alt="Imagem 2" />'
    );
  });

  test('deve escapar aspas simples corretamente', () => {
    const htmlWithQuotes = `<img src="https://example.com/image'with'quotes.jpg" alt="Test" />`;

    const processedHTML = htmlWithQuotes.replace(
      /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        const escapedSrc = src.replace(/'/g, "\\'");
        return `
          <div class="image-container">
            <img${before}src="${src}"${after}>
            <button onclick="window.handleImageDelete && window.handleImageDelete('${escapedSrc}')">
              ×
            </button>
          </div>
        `;
      }
    );

    expect(processedHTML).toContain("\\'");
  });
});
