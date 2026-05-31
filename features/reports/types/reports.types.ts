export enum ReportStatus {
    PENDING = 'PENDING',
    REVIEWED = 'REVIEWED',
    RESOLVED = 'RESOLVED',
}

export enum ReportTargetType {
    SUPPORT_REQUEST = 'SUPPORT_REQUEST',
    POST = 'POST',
    USER = 'USER',
}

export interface CreateReportRequest {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
}

export interface ReviewReportRequest {
    resolutionNote: string;
}

export interface ResolveReportRequest {
    resolutionNote: string;
    supportRequestRejectionReason?: string;
}

export interface ReportDetailResponse {
    id: string;
    reporterId: string;
    reporterName: string;
    reporterAvatarUrl?: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    status: ReportStatus;
    reviewedBy?: string;
    reviewedAt?: string;
    resolutionNote?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReportSummaryResponse {
    id: string;
    reporterId: string;
    reporterName: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    status: ReportStatus;
    createdAt: string;
}
