import React from 'react';
import styles from './color-picker.module.css';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

const PREDEFINED_COLORS = [
  '#ef4444', // Rouge
  '#f97316', // Orange
  '#f59e0b', // Ambre
  '#eab308', // Jaune
  '#84cc16', // Lime
  '#22c55e', // Vert
  '#10b981', // Emeraude
  '#06b6d4', // Cyan
  '#3b82f6', // Bleu
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Pourpre
  '#ec4899', // Rose
  '#f43f5e', // Rose rouge
  '#6b7280', // Gris
  '#374151', // Gris foncé
];

export function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  const handleColorSelect = (color: string) => {
    onChange(color);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`${styles.colorPicker} ${className}`}>
      <div className={styles.colorGrid}>
        {PREDEFINED_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`${styles.colorOption} ${value === color ? styles.selected : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            title={color}
          />
        ))}
      </div>
      
      {value && (
        <div className={styles.selectedColor}>
          <div 
            className={styles.selectedColorSwatch}
            style={{ backgroundColor: value }}
          />
          <span>Couleur sélectionnée : {value}</span>
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
          >
            Effacer
          </button>
        </div>
      )}
    </div>
  );
}