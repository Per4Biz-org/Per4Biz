import React from 'react';
import { Toast } from './Toast';
import styles from './Toast.module.css';

export interface ToastData {
  id: string;
  color?: string;
  icon?: any;
  label: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}