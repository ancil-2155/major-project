export type CloudinaryConfig = {
  cloudName: string;
  unsignedUploadPreset: string;
  signedUploadWorkerUrl?: string;
  deleteWorkerUrl?: string;
};

// Keep secrets out of mobile app code.
// For production, use signedUploadWorkerUrl from a secure backend/worker.
export const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'drykzgx1b',
  unsignedUploadPreset: 'acams_gallery',
  signedUploadWorkerUrl: '',
  deleteWorkerUrl: 'http://10.0.2.2:3000/api/cloudinary/delete',
};
