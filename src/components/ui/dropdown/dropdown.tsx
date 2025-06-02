import React, { useState, useRef, useEffect } from 'react';
import * as icons from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import styles from './dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof icons;
  label?: string;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  color,
  size = 'md',
  icon,
  label,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  const IconComponent = icon ? icons[icon] : null;

  const style = color ? {
    '--dropdown-color': color,
  } as React.CSSProperties : undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: DropdownOption) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <div
      ref={dropdownRef}
      className={`${styles.dropdown} ${isOpen ? styles.open : ''} ${styles[size]} ${className}`}
      style={style}
    >
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
      >
        {IconComponent && (
          <IconComponent size={iconSize} className={styles.icon} />
        )}
        <span>{selectedOption?.label || label || 'Sélectionner'}</span>
        <ChevronDown size={iconSize} className={styles.chevron} />
      </button>
      <div className={styles.menu}>
        {options.map((option) => (
          <div
            key={option.value}
            className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
            onClick={() => handleSelect(option)}
          >
            {IconComponent && (
              <IconComponent size={iconSize} className={styles.icon} />
            )}
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}