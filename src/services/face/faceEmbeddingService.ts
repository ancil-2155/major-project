import { Platform } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { normalizeEmbedding } from './embeddingMathService';
import { FaceBounds, preprocessImageToFaceNetInput } from './faceImagePreprocessor';

const EXPECTED_EMBEDDING_SIZE = 128;
const MODEL_PATH_LABEL = 'src/assets/models/facenet.tflite';
const MODEL_ASSET = require('../../assets/models/facenet.tflite');

let faceModel: any = null;

export type FaceModelDiagnostics = {
  modelLoaded: boolean;
  modelPath: string;
  inputShape: unknown;
  outputShape: unknown;
  lastModelError: string | null;
};

let diagnostics: FaceModelDiagnostics = {
  modelLoaded: false,
  modelPath: MODEL_PATH_LABEL,
  inputShape: null,
  outputShape: null,
  lastModelError: null,
};

export const loadFaceNetModel = async () => {
  if (faceModel) return faceModel;
  try {
    faceModel =
      Platform.OS === 'ios'
        ? await loadTensorflowModel(MODEL_ASSET, 'core-ml')
        : await loadTensorflowModel(MODEL_ASSET);

    diagnostics = {
      modelLoaded: true,
      modelPath: MODEL_PATH_LABEL,
      inputShape: faceModel?.inputs?.[0]?.shape || faceModel?.inputShape || null,
      outputShape: faceModel?.outputs?.[0]?.shape || faceModel?.outputShape || null,
      lastModelError: null,
    };
    console.log('[FaceAttendance] FaceNet model loaded', diagnostics);
    return faceModel;
  } catch (error) {
    diagnostics = {
      ...diagnostics,
      modelLoaded: false,
      lastModelError: error instanceof Error ? error.message : String(error),
    };
    console.error('[FaceAttendance] Failed to load FaceNet model:', error);
    throw error;
  }
};

export const getFaceModelDiagnostics = (): FaceModelDiagnostics => diagnostics;

export const isFaceModelLoaded = () => diagnostics.modelLoaded && !!faceModel;

export const generateFaceEmbedding = async (
  modelInput: Float32Array | Uint8Array | number[]
): Promise<number[]> => {
  const model = await loadFaceNetModel();
  if (!model) throw new Error('Model not loaded');

  const input =
    modelInput instanceof Float32Array || modelInput instanceof Uint8Array
      ? modelInput
      : Float32Array.from(modelInput);

  const outputBuffer = model.runSync
    ? model.runSync([input])
    : await model.run([input]);

  const rawOutput = Array.isArray(outputBuffer) ? outputBuffer[0] : outputBuffer;
  const embeddingArray = Array.from(rawOutput as Float32Array | number[]);

  if (embeddingArray.length !== EXPECTED_EMBEDDING_SIZE) {
    throw new Error(`Unexpected FaceNet embedding length: ${embeddingArray.length}`);
  }

  return normalizeEmbedding(embeddingArray);
};

export const generateFaceEmbeddingFromImage = async (
  imagePath: string,
  faceBounds?: FaceBounds | null
): Promise<number[]> => {
  const input = await preprocessImageToFaceNetInput(imagePath, faceBounds);
  return generateFaceEmbedding(input);
};
