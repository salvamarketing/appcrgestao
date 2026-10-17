import { useState, useCallback } from 'react';
import { compressAndResizeImage } from '../core/utils/imageProcessor';

export function usePhotoCapture() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64 = await compressAndResizeImage(file, 1200, 0.82);
      setIsProcessing(false);
      return base64;
    } catch (err) {
      setIsProcessing(false);
      setError('Erro ao processar imagem da câmera/galeria.');
      return null;
    }
  }, []);

  return {
    isProcessing,
    error,
    processFile,
  };
}
