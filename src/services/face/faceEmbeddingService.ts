import { loadTensorflowModel } from 'react-native-fast-tflite';
import { normalizeEmbedding } from './embeddingMathService';

// Global cache for the model so we don't load it multiple times
let faceModel: any = null;

export const loadFaceNetModel = async () => {
  if (faceModel) return faceModel;
  try {
    // IMPORTANT: The 'facenet.tflite' file must be placed in:
    // E:\at cams new\NEW-ONE--main\NEW-ONE--main\src\assets\models\facenet.tflite
    // Note: If you want to use MobileFaceNet for better performance later, replace the model file.
    // TODO: Optimize bundle size using MobileFaceNet if needed.
    faceModel = await loadTensorflowModel(require('../../assets/models/facenet.tflite'), 'core-ml');
    console.log('FaceNet Model loaded successfully.');
    return faceModel;
  } catch (error) {
    console.error('Failed to load FaceNet model:', error);
    throw error;
  }
};

/**
 * Generates a 128D embedding for a given cropped face image buffer.
 * Pre-requisite: 
 * - The image must be cropped strictly to the face bounds.
 * - Resized to 160x160 RGB.
 * - Converted to Uint8Array/Float32Array based on model quantization.
 */
export const generateFaceEmbedding = async (imageBuffer: Uint8Array): Promise<number[]> => {
  const model = await loadFaceNetModel();
  if (!model) throw new Error('Model not loaded');

  // Run the model (This assumes imageBuffer is properly pre-processed into a Flat Tensor array)
  const outputBuffer = await model.run([imageBuffer]);
  
  // Convert output to standard array and normalize it immediately.
  // FaceNet typically outputs a 128-float array.
  const embeddingArray = Array.from(outputBuffer[0] as Float32Array);
  return normalizeEmbedding(embeddingArray);
};
