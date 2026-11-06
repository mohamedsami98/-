import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error', 5000), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning', 4500), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast container in bottom-left or top-left in RTL */}
      <div 
        id="toast-container" 
        className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let IconComponent = Info;
          let iconColor = 'text-blue-400';

          if (t.type === 'success') {
            bg = 'bg-emerald-900/95 text-emerald-50 border-emerald-700/80 shadow-emerald-950/20';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (t.type === 'error') {
            bg = 'bg-rose-900/95 text-rose-50 border-rose-700/80 shadow-rose-950/20';
            IconComponent = XCircle;
            iconColor = 'text-rose-400';
          } else if (t.type === 'warning') {
            bg = 'bg-amber-900/95 text-amber-50 border-amber-700/80 shadow-amber-950/20';
            IconComponent = AlertTriangle;
            iconColor = 'text-amber-400';
          } else {
            bg = 'bg-slate-900/95 text-slate-50 border-slate-700 shadow-slate-950/20';
            IconComponent = Info;
            iconColor = 'text-sky-400';
          }

          return (
            <div
              key={t.id}
              id={`toast-${t.id}`}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bg}`}
              role="alert"
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {t.message}
              </div>
              <button
                type="button"
                id={`toast-close-${t.id}`}
                onClick={() => removeToast(t.id)}
                className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
