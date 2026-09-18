"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastType = "success" | "error";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idsRef = useRef<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    idsRef.current.add(id);
    setTimeout(() => {
      idsRef.current.delete(id);
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    idsRef.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-96 flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const isSuccess = toast.type === "success";

  return (
    <div
      className={`toast-enter flex items-start justify-between gap-3 rounded-md border shadow-lg ${isSuccess ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"} p-4 text-sm font-medium text-ink`}
      role="alert"
    >
      <p className="flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-xl leading-none text-ink/40 hover:bg-ink/10 hover:text-ink"
        type="button"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
