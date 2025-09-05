import React, { useState, useEffect } from 'react';
import { Euro } from 'lucide-react';
import styles from './monetary-input.module.css';

interface MonetaryInputProps {
  name?: string;
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}

export function MonetaryInput({
  name,
  value = '',
  onChange,
  onValueChange,
  placeholder = "0,00",
  disabled = false,
  error = false,
  className = '',
  step = "0.01",
  min,
  max,
  ...props
}: MonetaryInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Formater un nombre en format monétaire français
  const formatCurrency = (num: number): string => {
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Parser une chaîne monétaire en nombre
  const parseCurrency = (str: string): number => {
    if (!str || str.trim() === '') return 0;
    
    // Supprimer tous les espaces et remplacer la virgule par un point
    const cleaned = str.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  };

  // Mettre à jour l'affichage quand la valeur change
  useEffect(() => {
    if (typeof value === 'number') {
      setDisplayValue(isFocused ? value.toString().replace('.', ',') : formatCurrency(value));
    } else if (typeof value === 'string') {
      const numValue = parseCurrency(value);
      setDisplayValue(isFocused ? value : formatCurrency(numValue));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Afficher la valeur brute pour l'édition
    const numValue = parseCurrency(displayValue);
    setDisplayValue(numValue.toString().replace('.', ','));
    e.target.select(); // Sélectionner tout le texte
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const numValue = parseCurrency(e.target.value);
    
    // Formater pour l'affichage
    setDisplayValue(formatCurrency(numValue));
    
    // Déclencher les callbacks
    if (onValueChange) {
      onValueChange(numValue);
    }
    
    if (onChange) {
      // Créer un événement synthétique avec la valeur numérique
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || '',
          value: numValue.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permettre seulement les chiffres, virgules, points et le signe moins
    const sanitized = inputValue.replace(/[^0-9,.\-]/g, '');
    
    setDisplayValue(sanitized);
    
    // Si on est en mode focus, déclencher onChange immédiatement
    if (isFocused && onChange) {
      const numValue = parseCurrency(sanitized);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || '',
          value: numValue.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={`${styles.monetaryInput} ${error ? styles.error : ''} ${className}`}>
      <input
        {...props}
        name={name}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.input}
        inputMode="decimal"
      />
      <div className={styles.currency}>
        <Euro size={16} />
      </div>
    </div>
  );
}