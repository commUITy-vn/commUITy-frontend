export type MediaFileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';

export interface CreateMediaRequest {
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  altText?: string;
  isPublic: boolean;
}

export interface UpdateMediaRequest {
  altText?: string;
  isPublic?: boolean;
}

export interface MediaDetailResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  altText: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface MediaSummaryResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  createdAt: string;
}

export interface AttachMediaToPostRequest {
  mediaId: string;
  displayOrder?: number;
}

export interface PostMediaResponse {
  postId: string;
  mediaId: string;
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  isPublic: boolean;
  displayOrder: number;
  attachedAt: string;
}
