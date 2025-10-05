/**
 * Componente de Toast para Notificações
 * Sistema de notificações simples e funcional
 */

import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useToastNotification = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Retornar funções vazias ao invés de quebrar
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
};

// ✅ Componente individual de Toast
const ToastComponent: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Tempo da animação de saída
  }, [onRemove, toast.id]);

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-remover após duração especificada
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4";
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-green-500 bg-green-50 dark:bg-green-900/20`;
      case 'error':
        return `${baseStyles} border-red-500 bg-red-50 dark:bg-red-900/20`;
      case 'warning':
        return `${baseStyles} border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20`;
      case 'info':
        return `${baseStyles} border-blue-500 bg-blue-50 dark:bg-blue-900/20`;
      default:
        return `${baseStyles} border-blue-500 bg-blue-50 dark:bg-blue-900/20`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 transform",
        getStyles(),
        isVisible && !isRemoving 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0",
        "max-w-sm w-full"
      )}
    >
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

// ✅ Container de Toasts
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// ✅ Provider de Toast
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // 5 segundos por padrão
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// ✅ Hook utilitário para toasts comuns
// eslint-disable-next-line react-refresh/only-export-components
export const useToastHelpers = () => {
  const { addToast } = useToastNotification();

  return useMemo(() => ({
    success: (title: string, description?: string) => 
      addToast({ type: 'success', title, description }),
    
    error: (title: string, description?: string) => 
      addToast({ type: 'error', title, description }),
    
    warning: (title: string, description?: string) => 
      addToast({ type: 'warning', title, description }),
    
    info: (title: string, description?: string) => 
      addToast({ type: 'info', title, description }),
  }), [addToast]);
};
