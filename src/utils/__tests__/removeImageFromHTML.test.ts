import {
  removeImageFromHTML,
  imageExistsInHTML,
  getAllImageUrls,
} from '../removeImageFromHTML';

describe('removeImageFromHTML', () => {
  const sampleHTML = `
    <div>
      <h1>Documento de Teste</h1>
      <img src="https://example.com/image1.jpg" alt="Imagem 1" />
      <p>Texto entre imagens</p>
      <img src="https://example.com/image2.jpg" alt="Imagem 2" />
      <div>
        <img src="https://example.com/image3.jpg" alt="Imagem 3" />
      </div>
    </div>
  `;

  test('deve remover uma imagem específica', () => {
    const result = removeImageFromHTML(
      sampleHTML,
      'https://example.com/image2.jpg'
    );

    expect(result).not.toContain('https://example.com/image2.jpg');
    expect(result).toContain('https://example.com/image1.jpg');
    expect(result).toContain('https://example.com/image3.jpg');
  });

  test('deve remover múltiplas imagens', () => {
    const result = removeImageFromHTML(
      sampleHTML,
      'https://example.com/image1.jpg'
    );
    const result2 = removeImageFromHTML(
      result,
      'https://example.com/image3.jpg'
    );

    expect(result2).not.toContain('https://example.com/image1.jpg');
    expect(result2).not.toContain('https://example.com/image3.jpg');
    expect(result2).toContain('https://example.com/image2.jpg');
  });

  test('deve retornar HTML original se imagem não existir', () => {
    const result = removeImageFromHTML(
      sampleHTML,
      'https://example.com/nonexistent.jpg'
    );
    expect(result).toBe(sampleHTML);
  });

  test('deve retornar HTML original se parâmetros forem inválidos', () => {
    expect(removeImageFromHTML('', 'test')).toBe('');
    expect(removeImageFromHTML(sampleHTML, '')).toBe(sampleHTML);
    expect(removeImageFromHTML('', '')).toBe('');
  });
});

describe('imageExistsInHTML', () => {
  const sampleHTML = `
    <img src="https://example.com/image1.jpg" alt="Imagem 1" />
    <img src="https://example.com/image2.jpg" alt="Imagem 2" />
  `;

  test('deve retornar true se imagem existir', () => {
    expect(
      imageExistsInHTML(sampleHTML, 'https://example.com/image1.jpg')
    ).toBe(true);
    expect(
      imageExistsInHTML(sampleHTML, 'https://example.com/image2.jpg')
    ).toBe(true);
  });

  test('deve retornar false se imagem não existir', () => {
    expect(
      imageExistsInHTML(sampleHTML, 'https://example.com/nonexistent.jpg')
    ).toBe(false);
  });

  test('deve retornar false se parâmetros forem inválidos', () => {
    expect(imageExistsInHTML('', 'test')).toBe(false);
    expect(imageExistsInHTML(sampleHTML, '')).toBe(false);
  });
});

describe('getAllImageUrls', () => {
  test('deve extrair todas as URLs de imagens', () => {
    const html = `
      <img src="https://example.com/image1.jpg" alt="Imagem 1" />
      <img src="https://example.com/image2.jpg" alt="Imagem 2" />
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" alt="Base64 image" />
    `;

    const urls = getAllImageUrls(html);
    expect(urls).toHaveLength(3);
    expect(urls).toContain('https://example.com/image1.jpg');
    expect(urls).toContain('https://example.com/image2.jpg');
    expect(urls).toContain(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    );
  });

  test('deve retornar array vazio se não houver imagens', () => {
    const urls = getAllImageUrls('<div><p>Sem imagens</p></div>');
    expect(urls).toHaveLength(0);
  });

  test('deve retornar array vazio se HTML for vazio', () => {
    expect(getAllImageUrls('')).toHaveLength(0);
  });
});
