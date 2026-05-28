import { CLOUDINARY_CONFIG } from '../../config/cloudinaryConfig';
import {
  CloudinaryResourceType,
  CloudinaryUploadResult,
  LocalUploadFile,
} from '../../types/cloudinary';

type SignedSignatureResponse = {
  signature: string;
  timestamp: number;
  apiKey: string;
  uploadUrl?: string;
};

type UploadOptions = {
  folder?: string;
  preferredResourceType?: CloudinaryResourceType;
  useSignedUpload?: boolean;
  onProgress?: (progress: number) => void;
};

const inferResourceType = (
  mimeType: string,
  preferred?: CloudinaryResourceType,
): CloudinaryResourceType => {
  if (preferred && preferred !== 'auto') {
    return preferred;
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('msword') ||
    mimeType.includes('officedocument') ||
    mimeType.includes('presentation')
  ) {
    return 'raw';
  }
  return 'auto';
};

const uploadWithXhr = (
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
): Promise<any> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Cloudinary upload response parse failed.'));
        }
      } else {
        reject(new Error(`Cloudinary upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload.'));
    xhr.open('POST', url);
    xhr.send(formData);
  });

const getSignedSignature = async (
  folder?: string,
): Promise<SignedSignatureResponse> => {
  const workerUrl = CLOUDINARY_CONFIG.signedUploadWorkerUrl?.trim();
  if (!workerUrl) {
    throw new Error('Signed upload URL is not configured.');
  }

  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch Cloudinary signature.');
  }
  return response.json();
};

export const uploadLocalFileToCloudinary = async (
  file: LocalUploadFile,
  options: UploadOptions = {},
): Promise<CloudinaryUploadResult> => {
  const cloudName = CLOUDINARY_CONFIG.cloudName?.trim();
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured.');
  }

  const resourceType = inferResourceType(
    file.mimeType,
    options.preferredResourceType,
  );
  const apiPathType = resourceType === 'raw' || resourceType === 'auto' ? 'auto' : resourceType;
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.mimeType,
    name: file.name,
  } as any);

  if (options.folder) {
    formData.append('folder', options.folder);
  }

  let uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${apiPathType}/upload`;

  if (options.useSignedUpload) {
    const signed = await getSignedSignature(options.folder);
    uploadUrl = signed.uploadUrl || uploadUrl;
    formData.append('signature', signed.signature);
    formData.append('timestamp', String(signed.timestamp));
    formData.append('api_key', signed.apiKey);
  } else {
    const preset = CLOUDINARY_CONFIG.unsignedUploadPreset?.trim();
    if (!preset) {
      throw new Error('Cloudinary unsigned upload preset is not configured.');
    }
    formData.append('upload_preset', preset);
  }

  const response = await uploadWithXhr(uploadUrl, formData, options.onProgress);

  return {
    cloudinaryPublicId: response.public_id,
    cloudinarySecureUrl: response.secure_url,
    cloudinaryResourceType: response.resource_type || resourceType,
    cloudinaryFormat: response.format || '',
    bytes: response.bytes || file.sizeBytes || 0,
    originalFilename: response.original_filename || file.name,
    width: response.width || undefined,
    height: response.height || undefined,
    duration: response.duration || undefined,
  };
};

// Backward compatible API used by gallery flow.
export const uploadMediaToCloudinary = async (
  fileUri: string,
  mediaType: 'image' | 'video',
  onProgress?: (progress: number) => void,
  fileName?: string,
  mimeType?: string,
  sizeBytes?: number,
) => {
  const fallbackName = mediaType === 'image' ? 'gallery.jpg' : 'gallery.mp4';
  const fallbackType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';
  const result = await uploadLocalFileToCloudinary(
    {
      uri: fileUri,
      name: fileName || fallbackName,
      mimeType: mimeType || fallbackType,
      sizeBytes,
    },
    {
      preferredResourceType: mediaType,
      onProgress,
      folder: 'acams/gallery',
      useSignedUpload: false,
    },
  );

  return {
    secure_url: result.cloudinarySecureUrl,
    public_id: result.cloudinaryPublicId,
    resource_type: result.cloudinaryResourceType,
    format: result.cloudinaryFormat,
    width: result.width || 0,
    height: result.height || 0,
    duration: result.duration,
    bytes: result.bytes,
  };
};
