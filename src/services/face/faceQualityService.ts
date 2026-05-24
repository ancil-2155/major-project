import { FaceCaptureStep, FaceData, FaceValidationResult } from '../../types/face';

export const validateFace = (
  faces: FaceData[],
  step: FaceCaptureStep,
  frameWidth: number,
  frameHeight: number
): FaceValidationResult => {
  if (!faces || faces.length === 0) {
    return { isValid: false, message: 'No face detected. Place your face inside the frame.' };
  }
  
  if (faces.length > 1) {
    return { isValid: false, message: 'Multiple faces detected. Only one student is allowed.' };
  }

  const face = faces[0];
  
  // Basic bounds checking (Is face inside the frame roughly?)
  // Assuming oval is somewhat centered
  const centerX = face.bounds.x + face.bounds.width / 2;
  const centerY = face.bounds.y + face.bounds.height / 2;

  // These thresholds might need tweaking depending on the camera aspect ratio
  if (centerX < frameWidth * 0.3 || centerX > frameWidth * 0.7 ||
      centerY < frameHeight * 0.3 || centerY > frameHeight * 0.7) {
    return { isValid: false, message: 'Face is not centered.' };
  }

  // Size checking
  const faceArea = face.bounds.width * face.bounds.height;
  const frameArea = frameWidth * frameHeight;
  const ratio = faceArea / frameArea;

  if (ratio < 0.1) {
    return { isValid: false, message: 'Move closer to the camera.' };
  }
  if (ratio > 0.6) {
    return { isValid: false, message: 'Move slightly back.' };
  }

  // Pose checking based on step
  const yaw = face.yaw; // typically negative for left turn, positive for right turn depending on lib
  // roll = face.roll
  // pitch = face.pitch
  
  // Note: Vision Camera Face Detector Euler angles:
  // Yaw: looking left/right (Right is negative in some, positive in others. Let's assume standard: Right is positive, Left is negative)
  // Pitch: looking up/down

  if (Math.abs(face.roll) > 15) {
    return { isValid: false, message: 'Keep your head straight, do not tilt.' };
  }

  switch (step) {
    case 'front':
      if (Math.abs(yaw) > 15) {
        return { isValid: false, message: 'Please look straight.' };
      }
      break;
    case 'left':
      if (yaw > -20) { // meaning not looking left enough (assuming looking left = negative yaw)
        // Note: It might be the other way around in MLKit mirrored camera. Adjust in actual testing.
        return { isValid: false, message: 'Please turn your face left.' };
      }
      break;
    case 'right':
      if (yaw < 20) {
        return { isValid: false, message: 'Please turn your face right.' };
      }
      break;
  }

  // Blurry/Light detection would require frame analysis which might be heavy in JS.
  // Assuming basic validation passed for now.

  return { isValid: true, message: 'Perfect. Hold still...' };
};
