import React, { ReactNode } from 'react';
import styles from './form.module.css';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  description,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {description && <p className={styles.description}>{description}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}