import { create } from "zustand";

// ─── UI Slice ─────────────────────────────────────────────────────────────

interface UIState {
  isAddSheetOpen: boolean;
  theme: "dark" | "light" | "auto";
  openAddSheet: () => void;
  closeAddSheet: () => void;
  setTheme: (t: "dark" | "light" | "auto") => void;
}

// ─── Toast Slice ─────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  action?: { label: string; fn: () => void };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ─── Combined Store ───────────────────────────────────────────────────────

type StoreState = UIState & ToastState;

export const useStore = create<StoreState>()((set) => ({
  // UI
  isAddSheetOpen: false,
  theme: "dark",
  openAddSheet: () => set({ isAddSheetOpen: true }),
  closeAddSheet: () => set({ isAddSheetOpen: false }),
  setTheme: (t) => set({ theme: t }),

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    // Auto-dismiss after 4s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Atomic selector hooks ────────────────────────────────────────────────
export const useIsAddSheetOpen = () => useStore((s) => s.isAddSheetOpen);
export const useTheme = () => useStore((s) => s.theme);
export const useToasts = () => useStore((s) => s.toasts);
