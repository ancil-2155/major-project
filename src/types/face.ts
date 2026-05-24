export type FaceCaptureStep = 'front' | 'left' | 'right';

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceData {
  bounds: FaceBounds;
  pitch: number; // up/down
  yaw: number;   // left/right
  roll: number;  // tilt
  // Vision camera face detector may have other properties based on the version
}

export interface FaceValidationResult {
  isValid: boolean;
  message: string;
}
