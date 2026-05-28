import { NativeModules, Platform } from 'react-native';

export const FACENET_INPUT_SIZE = 160;
export const FACENET_INPUT_LENGTH = FACENET_INPUT_SIZE * FACENET_INPUT_SIZE * 3;

export type FaceBounds = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type NativeFaceImagePreprocessor = {
  preprocessImage: (
    imagePath: string,
    faceBounds: FaceBounds | null,
    inputSize: number
  ) => Promise<number[]>;
};

const nativePreprocessor =
  NativeModules.FaceImagePreprocessor as NativeFaceImagePreprocessor | undefined;

export const preprocessImageToFaceNetInput = async (
  imagePath: string,
  faceBounds?: FaceBounds | null
): Promise<Float32Array> => {
  if (!imagePath) {
    throw new Error('No image path provided for face preprocessing.');
  }

  if (Platform.OS !== 'android') {
    throw new Error('Face image preprocessing is currently implemented for Android only.');
  }

  if (!nativePreprocessor?.preprocessImage) {
    throw new Error('Face image preprocessor native module is unavailable.');
  }

  const values = await nativePreprocessor.preprocessImage(
    imagePath,
    faceBounds || null,
    FACENET_INPUT_SIZE
  );

  if (!Array.isArray(values) || values.length !== FACENET_INPUT_LENGTH) {
    throw new Error(
      `Invalid preprocessed face input length: ${Array.isArray(values) ? values.length : 0}`
    );
  }

  return Float32Array.from(values);
};
