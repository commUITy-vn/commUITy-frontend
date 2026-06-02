export enum SupportStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum UrgencyLevel {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum SupportCategory {
  MEDICAL = "MEDICAL",
  FOOD = "FOOD",
  LIVING = "LIVING",
  EDUCATION = "EDUCATION",
  JOB = "JOB",
  HOUSING = "HOUSING",
  LEGAL = "LEGAL",
  EMERGENCY = "EMERGENCY",
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
  [SupportStatus.COMPLETED]: "Completed",
  [SupportStatus.REJECTED]: "Rejected",
  [SupportStatus.CANCELLED]: "Cancelled",
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.HIGH]: "High",
  [UrgencyLevel.MEDIUM]: "Medium",
  [UrgencyLevel.LOW]: "Low",
};

export const CATEGORY_LABELS: Record<SupportCategory, string> = {
  [SupportCategory.MEDICAL]: "Medical",
  [SupportCategory.FOOD]: "Food",
  [SupportCategory.LIVING]: "Living",
  [SupportCategory.EDUCATION]: "Education",
  [SupportCategory.JOB]: "Job",
  [SupportCategory.HOUSING]: "Housing",
  [SupportCategory.LEGAL]: "Legal",
  [SupportCategory.EMERGENCY]: "Emergency",
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
  VND = "VND",
  KG = "KG",
  PIECE = "PIECE",
  BOX = "BOX",
  LITER = "LITER",
  PACKAGE = "PACKAGE",
  SET = "SET",
  PERSON = "PERSON",
  OTHER = "OTHER",
}

export const UNIT_LABELS: Record<UnitOptions, string> = {
  [UnitOptions.VND]: "VND",
  [UnitOptions.KG]: "Kg",
  [UnitOptions.PIECE]: "Piece",
  [UnitOptions.BOX]: "Box",
  [UnitOptions.LITER]: "Liter",
  [UnitOptions.PACKAGE]: "Package",
  [UnitOptions.SET]: "Set",
  [UnitOptions.PERSON]: "Person",
  [UnitOptions.OTHER]: "Other",
};

export interface SupportItem {
  id: string;
  category: ItemCategory;
  name: string;
  neededQuantity: number;
  receivedQuantity: number;
  remainingQuantity?: number;
  isFulfilled?: boolean;
  unit?: string;
}

export interface SupportItemContribution {
  itemId: string;
  quantity: number;
  notes: string;
}
