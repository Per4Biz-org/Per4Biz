import React from 'react';
import * as icons from 'lucide-react';
import styles from './Toggle.module.css';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  label?: string;
  icon?: keyof typeof icons;
  showIcon?: boolean;
  className?: string;
}

export function Toggle({
  checked = false,
  onChange,
  disabled = false,
  color,
  label,
  icon,
  showIcon = false,
  className = '',
}: ToggleProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  const style = color ? {
    '--toggle-active': color,
    '--toggle-hover': `color-mix(in srgb, ${color}, black 20%)`,
  } as React.CSSProperties : undefined;

  const IconComponent = icon ? icons[icon] : null;

  return (
    <label 
      className={`${styles.toggle} ${disabled ? styles.disabled : ''} ${className}`}
      style={style}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.input}
      />
      <div className={styles.track}>
        <div className={styles.thumb}>
          {IconComponent && (showIcon || checked) && (
            <IconComponent size={12} className={styles.icon} />
          )}
        </div>
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}