import React from 'react';
import * as icons from 'lucide-react';
import styles from './progress-bar.module.css';

interface ProgressBarProps {
  percent: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof icons;
  label?: string;
  className?: string;
}

export function ProgressBar({
  percent,
  color,
  size = 'md',
  icon,
  label,
  className = '',
}: ProgressBarProps) {
  // Ensure percent is between 0 and 100
  const normalizedPercent = Math.min(100, Math.max(0, percent));
  
  const style = {
    '--progress-color': color,
    '--progress-percent': `${normalizedPercent}%`,
  } as React.CSSProperties;

  const IconComponent = icon ? icons[icon] : null;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <div 
      className={`${styles.progressBar} ${styles[size]} ${className}`}
      style={style}
    >
      {IconComponent && (
        <IconComponent size={iconSize} className={styles.icon} />
      )}
      <div className={styles.track}>
        <div className={styles.fill} />
      </div>
      {(label || percent) && (
        <span className={styles.label}>
          {label || `${Math.round(normalizedPercent)}%`}
        </span>
      )}
    </div>
  );
}