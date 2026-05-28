import { generateFaceEmbeddingFromImage } from './faceEmbeddingService';
import { FaceBounds } from './faceImagePreprocessor';

export const processLiveFrameToEmbedding = async (
  imagePath: string,
  faceBounds?: FaceBounds | null
): Promise<number[]> => {
  try {
    return await generateFaceEmbeddingFromImage(imagePath, faceBounds);
  } catch (error) {
    console.error('Error processing live frame to embedding:', error);
    throw error;
  }
};
