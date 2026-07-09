import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { cx } from '../lib/classNames';
import { Button } from './Button';
import {
  ToastContext,
  type ToastContextValue,
  type ToastOptions,
  type ToastType,
} from './toastContext';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

const DEFAULT_TOAST_DURATION_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    (
      message: string,
      { type = 'info', durationMs = DEFAULT_TOAST_DURATION_MS }: ToastOptions = {},
    ) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((currentToasts) => [
        ...currentToasts.slice(-3),
        { id, message, type },
      ]);

      if (durationMs > 0) {
        const timer = window.setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (message, options) =>
        showToast(message, { ...options, type: 'success' }),
      error: (message, options) =>
        showToast(message, { ...options, type: 'error' }),
      info: (message, options) =>
        showToast(message, { ...options, type: 'info' }),
      warning: (message, options) =>
        showToast(message, { ...options, type: 'warning' }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport dismiss={dismiss} toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  dismiss,
  toasts,
}: {
  dismiss: (id: number) => void;
  toasts: Toast[];
}) {
  return (
    <div
      aria-live="polite"
      className="fixed right-3 top-3 z-50 grid w-[min(360px,calc(100vw-24px))] gap-inline"
      role="status"
    >
      {toasts.map((toast) => (
        <div
          className={cx(
            'flex items-start gap-inline rounded-panel border bg-app-surface-raised px-3.5 py-3 text-sm font-semibold shadow-lg',
            toast.type === 'success' && 'border-brand-200 text-brand-700',
            toast.type === 'error' && 'border-danger-300 text-danger-700',
            toast.type === 'info' && 'border-app-border-strong text-app-text',
            toast.type === 'warning' && 'border-warning-300 text-warning-700',
          )}
          key={toast.id}
        >
          <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
          <Button
            aria-label="Dismiss notification"
            className="-mr-1 -mt-1 min-h-7 w-7"
            icon={<X size={14} />}
            onClick={() => dismiss(toast.id)}
            variant="ghost"
          />
        </div>
      ))}
    </div>
  );
}
