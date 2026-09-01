import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message, duration: 6000 }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message, duration: 5000 }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-modal flex items-start space-x-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md ${
              t.type === 'success'
                ? 'bg-ops-surface/95 border-emerald-500/40 text-ops-text shadow-glow-emerald/30'
                : t.type === 'error'
                ? 'bg-ops-surface/95 border-rose-500/40 text-ops-text shadow-glow-rose/30'
                : t.type === 'warning'
                ? 'bg-ops-surface/95 border-amber-500/40 text-ops-text shadow-glow-amber/30'
                : 'bg-ops-surface/95 border-cyan-500/40 text-ops-text shadow-glow-cyan/30'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-bold text-ops-text leading-tight uppercase tracking-wider">{t.title}</p>
              {t.message && <p className="text-xs text-ops-muted mt-1 leading-snug font-sans">{t.message}</p>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-ops-dim hover:text-ops-text rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
