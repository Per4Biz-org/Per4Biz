import React, { useEffect, useState } from 'react';
import * as icons from 'lucide-react';
import { X } from 'lucide-react';
import styles from './Toast.module.css';

interface ToastProps {
  id: string;
  color?: string;
  icon?: keyof typeof icons;
  label: string;
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({
  id,
  color,
  icon = 'Bell',
  label,
  onClose,
  duration = 3000,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const IconComponent = icons[icon];

  const style = color ? {
    '--toast-color': color,
  } as React.CSSProperties : undefined;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 200);
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, id, onClose]);

  return (
    <div 
      className={`${styles.toast} ${isExiting ? styles.exit : ''}`}
      style={style}
    >
      <IconComponent size={18} className={styles.icon} />
      <span className={styles.label}>{label}</span>
      <button
        className={styles.closeButton}
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(id), 200);
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}