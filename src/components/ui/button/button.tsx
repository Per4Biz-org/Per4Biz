import React, { ButtonHTMLAttributes } from 'react';
import * as icons from 'lucide-react';
import styles from './button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  icon?: keyof typeof icons;
  label: string;
  tooltip?: string;
}

export function Button({
  label,
  size = 'md',
  color,
  icon,
  tooltip,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Não aplicar cor customizada se o botão estiver desabilitado
  const style = !disabled && color ? {
    '--button-bg': color,
    '--button-hover': `color-mix(in srgb, ${color}, black 20%)`,
  } as React.CSSProperties : {};

  const IconComponent = icon ? icons[icon] : null;

  return (
    <div className={tooltip ? styles.tooltipContainer : ''}>
      <button
        className={`${styles.button} ${styles[size]} ${disabled ? styles.buttonDisabled : ''} ${className}`}
        style={style}
        title={tooltip}
        disabled={disabled}
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
      {tooltip && (
        <div className={styles.tooltip}>
          {tooltip}
        </div>
      )}
    </div>
  );
}