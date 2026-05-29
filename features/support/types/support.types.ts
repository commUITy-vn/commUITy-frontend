export enum SupportStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  IN_PROGRESS = "IN_PROGRESS",
  FULFILLED = "FULFILLED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum UrgencyLevel {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum SupportCategory {
  FOOD = "FOOD",
  SHELTER = "SHELTER",
  MEDICAL = "MEDICAL",
  EDUCATION = "EDUCATION",
  TRANSPORT = "TRANSPORT",
  OTHER = "OTHER",
}

export interface SupportRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  urgency: UrgencyLevel;
  status: SupportStatus;
  category: SupportCategory;
  requesterName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportRequestDTO {
  title: string;
  description: string;
  location: string;
  urgency: UrgencyLevel;
  category: SupportCategory;
}

export const STATUS_LABELS: Record<SupportStatus, string> = {
  [SupportStatus.PENDING]: "Pending",
  [SupportStatus.APPROVED]: "Approved",
  [SupportStatus.IN_PROGRESS]: "In Progress",
  [SupportStatus.FULFILLED]: "Fulfilled",
  [SupportStatus.REJECTED]: "Rejected",
  [SupportStatus.CANCELLED]: "Cancelled",
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.HIGH]: "High",
  [UrgencyLevel.MEDIUM]: "Medium",
  [UrgencyLevel.LOW]: "Low",
};

export const CATEGORY_LABELS: Record<SupportCategory, string> = {
  [SupportCategory.FOOD]: "Food",
  [SupportCategory.SHELTER]: "Shelter",
  [SupportCategory.MEDICAL]: "Medical",
  [SupportCategory.EDUCATION]: "Education",
  [SupportCategory.TRANSPORT]: "Transport",
  [SupportCategory.OTHER]: "Other",
};

// --- Support Item Types (Module 7) ---

export enum ItemCategory {
  GOODS = "GOODS",
  MONEY = "MONEY",
}

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  [ItemCategory.GOODS]: "Goods",
  [ItemCategory.MONEY]: "Money",
};

export enum UnitOptions {
  PIECE = "PIECE",
  KG = "KG",
  LITER = "LITER",
  OTHER = "OTHER",
}

export const UNIT_LABELS: Record<UnitOptions, string> = {
  [UnitOptions.PIECE]: "Piece",
  [UnitOptions.KG]: "Kg",
  [UnitOptions.LITER]: "Liter",
  [UnitOptions.OTHER]: "Other",
};

export interface SupportItem {
  id: string;
  category: ItemCategory;
  name: string;
  neededQuantity: number;
  receivedQuantity: number;
  unit?: string;
}

export interface SupportItemContribution {
  itemId: string;
  quantity: number;
  notes: string;
}
