// src/components/ui/use-toast.ts
import { toast as sonnerToast } from "sonner";

// Get the correct type from sonner's function signature
type ToastOptions = Parameters<typeof sonnerToast>[0];

export const toast = (options: ToastOptions) => {
  sonnerToast(options);
};
