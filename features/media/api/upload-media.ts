import { Platform } from 'react-native';
import { env } from '@/config/env';
import { api } from '@/lib/api-client';

export type UploadMediaInput = {
  file?: File;
  uri?: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  folderName: string;
  altText?: string;
  isPublic?: boolean;
};

const resolveFileType = (mimeType: string) =>
  mimeType.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';

const appendUploadFile = (formData: FormData, input: UploadMediaInput) => {
  if (Platform.OS === 'web') {
    if (!input.file) {
      throw new Error(`Missing local file for ${input.fileName}`);
    }
    formData.append('file', input.file, input.fileName);
    return;
  }

  if (!input.uri) {
    throw new Error(`Missing local file URI for ${input.fileName}`);
  }

  formData.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as any);
};

const uploadViaBackend = async (input: UploadMediaInput) => {
  const formData = new FormData();
  appendUploadFile(formData, input);
  formData.append('folderName', input.folderName);
  formData.append('isPublic', String(input.isPublic ?? true));
  formData.append('altText', input.altText || input.fileName);

  return api.postForm<any>('/api/v1/media/upload', formData);
};

const uploadViaCloudinaryAndRegister = async (input: UploadMediaInput) => {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary upload failed on the backend, and frontend Cloudinary fallback is not configured.',
    );
  }

  const uploadToCloudinary = async (includeFolder: boolean) => {
    const formData = new FormData();
    appendUploadFile(formData, input);
    formData.append('upload_preset', uploadPreset);
    if (includeFolder && (input.folderName || env.CLOUDINARY_FOLDER)) {
      formData.append('folder', input.folderName || env.CLOUDINARY_FOLDER);
    }

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploaded = await uploadRes.json().catch(() => null);
    if (!uploadRes.ok) {
      throw new Error(uploaded?.error?.message || 'Failed to upload file to Cloudinary.');
    }
    return uploaded;
  };

  let uploaded: any;
  try {
    uploaded = await uploadToCloudinary(true);
  } catch (error: any) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('folder') && !message.includes('parameter')) {
      throw error;
    }
    uploaded = await uploadToCloudinary(false);
  }

  return api.post<any>('/api/v1/media', {
    fileName: input.fileName,
    fileUrl: uploaded.secure_url || uploaded.url,
    fileType: resolveFileType(input.mimeType),
    mimeType: input.mimeType,
    fileSize: input.fileSize || uploaded.bytes || 0,
    altText: input.altText || input.fileName,
    isPublic: input.isPublic ?? true,
  });
};

export const uploadMedia = async (input: UploadMediaInput) => {
  try {
    return await uploadViaBackend(input);
  } catch (backendError: any) {
    try {
      return await uploadViaCloudinaryAndRegister(input);
    } catch (fallbackError: any) {
      const backendMessage = backendError?.message ? `Backend upload: ${backendError.message}` : '';
      const fallbackMessage = fallbackError?.message ? `Cloudinary fallback: ${fallbackError.message}` : '';
      throw new Error([backendMessage, fallbackMessage].filter(Boolean).join('\n') || 'Failed to upload media.');
    }
  }
};
