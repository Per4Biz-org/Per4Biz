import React, { ReactNode } from 'react';
import styles from './form.module.css';

interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div className={`${styles.actions} ${className}`}>
      {children}
    </div>
  );
}