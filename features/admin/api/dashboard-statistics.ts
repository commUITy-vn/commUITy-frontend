import { api } from "@/lib/api-client";

export interface UserStatisticsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  requesters: number;
  volunteers: number;
  collaborators: number;
  admins: number;
}

export interface SupportRequestStatisticsResponse {
  totalSupportRequests: number;
  pending: number;
  approved: number;
  inProgress: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

export interface CategoryStatisticsItemResponse {
  categoryId: string;
  categoryName: string;
  supportRequestCount: number;
}

export interface CategoryStatisticsResponse {
  totalCategories: number;
  activeCategories: number;
  categories: CategoryStatisticsItemResponse[];
}

export interface PostStatisticsResponse {
  totalPosts: number;
  active: number;
  underReview: number;
  hidden: number;
  removed: number;
}

export interface ReportStatisticsResponse {
  totalReports: number;
  supportRequestReports: number;
  postReports: number;
  userReports: number;
  pending: number;
  reviewed: number;
  resolved: number;
}

export const getUserStatistics = () =>
  api.get<UserStatisticsResponse>("/api/admin/dashboard/users");

export const getSupportRequestStatistics = () =>
  api.get<SupportRequestStatisticsResponse>("/api/admin/dashboard/support-requests");

export const getCategoryStatistics = () =>
  api.get<CategoryStatisticsResponse>("/api/admin/dashboard/categories");

export const getPostStatistics = () =>
  api.get<PostStatisticsResponse>("/api/admin/dashboard/posts");

export const getReportStatistics = () =>
  api.get<ReportStatisticsResponse>("/api/admin/dashboard/reports");
