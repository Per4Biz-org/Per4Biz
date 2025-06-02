import React, { ReactNode } from 'react';
import styles from './form.module.css';

interface FormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  size?: number;
  columns?: number;
  className?: string;
}

export function Form({
  children,
  onSubmit,
  size = 100,
  columns = 1,
  className = ''
}: FormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const style = {
    '--form-width': `${size}%`,
    '--form-columns': columns,
    '--actions-column-start': columns > 1 ? columns : 1,
  } as React.CSSProperties;

  return (
    <form 
      className={`${styles.form} ${className}`}
      style={style}
      onSubmit={handleSubmit}
    >
      <div className={styles.columns}>{children}</div>
    </form>
  );
}