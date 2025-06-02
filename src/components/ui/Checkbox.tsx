import React from 'react';
import * as icons from 'lucide-react';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof icons;
  label?: string;
  className?: string;
}

export function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  color,
  size = 'md',
  icon = 'Check',
  label,
  className = '',
}: CheckboxProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  const style = color ? {
    '--checkbox-color': color,
  } as React.CSSProperties : undefined;

  const IconComponent = icons[icon];
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <label 
      className={`${styles.checkbox} ${disabled ? styles.disabled : ''} ${className}`}
      style={style}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.input}
      />
      <div className={`${styles.box} ${styles[size]}`}>
        <IconComponent size={iconSize} className={styles.icon} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}