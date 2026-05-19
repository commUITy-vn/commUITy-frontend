import { create } from "zustand"
import {
    UrgencyLevel,
    SupportCategory,
    SupportItem,
} from "@/features/support/types/support.types"

interface CreateRequestState {
    // Form fields
    category: SupportCategory | null
    title: string
    description: string
    location: string
    urgency: UrgencyLevel
    items: SupportItem[]

    // Actions
    setCategory: (category: SupportCategory) => void
    setTitle: (title: string) => void
    setDescription: (description: string) => void
    setLocation: (location: string) => void
    setUrgency: (urgency: UrgencyLevel) => void
    setItems: (items: SupportItem[]) => void
    addItem: (item: SupportItem) => void
    removeItem: (itemId: string) => void
    reset: () => void
}

const initialState = {
    category: null as SupportCategory | null,
    title: "",
    description: "",
    location: "",
    urgency: UrgencyLevel.MEDIUM,
    items: [] as SupportItem[],
}

export const useCreateRequestStore = create<CreateRequestState>((set) => ({
    ...initialState,

    setCategory: (category) => set({ category }),
    setTitle: (title) => set({ title }),
    setDescription: (description) => set({ description }),
    setLocation: (location) => set({ location }),
    setUrgency: (urgency) => set({ urgency }),
    setItems: (items) => set({ items }),
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    removeItem: (itemId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),
    reset: () => set(initialState),
}))
