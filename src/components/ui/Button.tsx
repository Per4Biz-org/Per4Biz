import React, { ButtonHTMLAttributes } from 'react';
import * as icons from 'lucide-react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  icon?: keyof typeof icons;
  label: string;
}

export function Button({
  label,
  size = 'md',
  color,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const style = {
    '--button-bg': color,
    '--button-hover': `color-mix(in srgb, ${color}, black 20%)`,
  } as React.CSSProperties;

  const IconComponent = icon ? icons[icon] : null;

  return (
    <button
      className={`${styles.button} ${styles[size]} ${className}`}
      style={style}
      {...props}
    >
      {IconComponent && (
        <IconComponent
          size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18}
          className={styles.icon}
        />
      )}
      {label}
    </button>
  );
}