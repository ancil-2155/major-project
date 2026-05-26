import { CLOUDINARY_CONFIG } from '../../config/cloudinaryConfig';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  duration?: number;
  bytes: number;
}

export const uploadMediaToCloudinary = async (
  fileUri: string,
  mediaType: 'image' | 'video',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  if (!CLOUDINARY_CONFIG.CLOUD_NAME || CLOUDINARY_CONFIG.CLOUD_NAME === 'YOUR_CLOUD_NAME_HERE') {
    throw new Error('Cloudinary Cloud Name is not configured.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/${mediaType}/upload`;

  const formData = new FormData();
  formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);

  // Extract filename and type from URI
  const fileName = fileUri.split('/').pop() || 'upload.bin';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  let mimeType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';
  if (extension === 'png') mimeType = 'image/png';
  if (extension === 'webp') mimeType = 'image/webp';
  if (extension === 'mov') mimeType = 'video/quicktime';

  formData.append('file', {
    uri: fileUri,
    type: mimeType,
    name: fileName,
  } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            resource_type: response.resource_type,
            format: response.format,
            width: response.width,
            height: response.height,
            duration: response.duration,
            bytes: response.bytes,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.open('POST', url);
    xhr.send(formData);
  });
};
