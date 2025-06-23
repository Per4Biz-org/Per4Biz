import React from 'react';
import { FileX } from 'lucide-react';
import styles from './data-table-full.module.css';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <FileX size={48} className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyMessage}>{message}</p>
    </div>
  );
}