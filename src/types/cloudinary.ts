export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

export type LocalUploadFile = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
};

export type CloudinaryUploadResult = {
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  cloudinaryResourceType: CloudinaryResourceType;
  cloudinaryFormat: string;
  bytes: number;
  originalFilename: string;
  width?: number;
  height?: number;
  duration?: number;
};
