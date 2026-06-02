import {
    SupportCategory,
    SupportItem,
    UrgencyLevel,
} from "@/features/support/types/support.types";
import { create } from "zustand";

interface CreateRequestState {
  // Form fields
  category: SupportCategory | null;
  categoryId: string | null;
  categoryName: string;
  title: string;
  description: string;
  address: string; // Sửa từ location thành address cho giống DB
  latitude: number | null;
  longitude: number | null;
  urgency: UrgencyLevel;
  items: SupportItem[];

  // Actions
  setCategory: (category: SupportCategory) => void;
  setCategoryId: (categoryId: string | null) => void;
  setCategoryName: (categoryName: string) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setAddress: (a: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  setUrgency: (urgency: UrgencyLevel) => void;
  setItems: (items: SupportItem[]) => void;
  addItem: (item: SupportItem) => void;
  removeItem: (itemId: string) => void;
  reset: () => void;
}

const initialState = {
  category: null as SupportCategory | null,
  categoryId: null as string | null,
  categoryName: "",
  title: "",
  description: "",
  address: "",
  latitude: null as number | null,
  longitude: null as number | null,
  urgency: UrgencyLevel.MEDIUM,
  items: [] as SupportItem[],
};

export const useCreateRequestStore = create<CreateRequestState>((set) => ({
  ...initialState,

  setCategory: (category) => set({ category }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setCategoryName: (categoryName) => set({ categoryName }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setAddress: (address) => set({ address }),
  setCoordinates: (latitude, longitude) => set({ latitude, longitude }),
  setUrgency: (urgency) => set({ urgency }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),
  reset: () => set(initialState),
}));
