/**
 * Utilitário central para processamento de fotos da Câmera e Galeria
 * Trata leitura segura com FileReader, validação de formato e compressão.
 */

export interface ProcessedImage {
  dataUrl: string;
  filename: string;
  sizeBytes: number;
}

/**
 * Lê arquivo de imagem como Base64 (DataURL), com tratamento de erros.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao processar arquivo de imagem.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Erro na leitura do arquivo.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona e comprime uma imagem para otimização em redes móveis
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
