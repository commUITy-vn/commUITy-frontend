import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'message' | 'notification';
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
  duration?: number;
}

interface ToastStore {
  toast: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (t) => {
    const id = Math.random().toString();
    set({ toast: { ...t, id } });
  },
  hideToast: () => set({ toast: null }),
}));
