import { generateFaceEmbedding } from './faceEmbeddingService';

/**
 * Service to process live camera frames, extract the face region,
 * and generate a live embedding vector.
 */

// Mock cropping utility since native frame cropping isn't implemented.
// In a full production app, this would use a native worklet or image resizer
// to strictly crop the face bounds to 160x160 before generating the embedding.
const mockCropAndResizeFace = (frameData: any, faceBounds: any): Uint8Array => {
  // Returns a dummy 160x160x3 byte array
  const dummySize = 160 * 160 * 3;
  const buffer = new Uint8Array(dummySize);
  for (let i = 0; i < dummySize; i++) {
    buffer[i] = Math.floor(Math.random() * 255);
  }
  return buffer;
};

export const processLiveFrameToEmbedding = async (
  frameData: any, // This would be the frame buffer from vision camera
  faceBounds: any // The bounds from face detector
): Promise<number[]> => {
  try {
    // 1. Crop and resize the face region to 160x160 RGB
    const croppedFaceBuffer = mockCropAndResizeFace(frameData, faceBounds);

    // 2. Generate the 128D embedding using the existing model
    const liveEmbedding = await generateFaceEmbedding(croppedFaceBuffer);

    return liveEmbedding;
  } catch (error) {
    console.error('Error processing live frame to embedding:', error);
    throw error;
  }
};
