import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Toast notification component.
 *
 * Props:
 *   toasts   — array of { id, type, message }
 *              type: 'success' | 'error' | 'info'
 *   onRemove — callback(id) called when a toast is dismissed
 *
 * Usage (see Dashboard.jsx for the useToast hook pattern):
 *   const { toasts, showToast, removeToast } = useToast();
 *   <ToastContainer toasts={toasts} onRemove={removeToast} />
 *   showToast('success', 'File uploaded!');
 */

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

const AUTO_DISMISS_MS = 4000;

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

/**
 * Custom hook — manages the toast queue.
 * Returns { toasts, showToast, removeToast }
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

export default ToastContainer;
