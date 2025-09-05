import React, { useState, useEffect } from 'react';
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
    // Format français avec espaces comme séparateurs de milliers et virgule décimale
    const formatted = new Intl.NumberFormat('fr-FR', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(num)); // Utiliser la valeur absolue pour le formatage
    
    // Ajouter le signe négatif si nécessaire
    return num < 0 ? `-${formatted}` : formatted;
  };

  // Parser une chaîne monétaire en nombre
  const parseCurrency = (str: string): number => {
    if (!str || str.trim() === '') return 0;
    
    // Détecter le signe négatif
    const isNegative = str.trim().startsWith('-');
    
    // Supprimer le signe négatif temporairement pour le traitement
    let cleanStr = str.replace('-', '');
    
    // Supprimer les espaces (séparateurs de milliers) et remplacer la virgule par un point
    const cleaned = str
      .replace(/\s/g, '') // Supprimer tous les espaces
      .replace(',', '.') // Remplacer virgule par point pour le parsing
      .replace(/[^\d.\-]/g, ''); // Garder seulement chiffres, point et tiret
    
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  };

  // Mettre à jour l'affichage quand la valeur change
  useEffect(() => {
    if (typeof value === 'number') {
      if (value === 0 && !isFocused) {
        // Afficher un champ vide si la valeur est 0 et pas en focus
        setDisplayValue('');
        return;
      }
      
      if (isFocused) {
        // En mode édition, afficher la valeur brute avec virgule
        setDisplayValue(value.toString().replace('.', ','));
      } else {
        // En mode affichage, formater avec espaces et virgule
        setDisplayValue(formatCurrency(value));
      }
    } else if (typeof value === 'string') {
      const numValue = parseCurrency(value);
      if (numValue === 0 && !isFocused && value === '') {
        // Garder le champ vide si la chaîne est vide
        setDisplayValue('');
        return;
      }
      
      if (isFocused) {
        // En mode édition, garder la valeur telle que saisie (avec virgule)
        setDisplayValue(value.replace('.', ','));
      } else {
        // En mode affichage, formater
        setDisplayValue(formatCurrency(numValue));
      }
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Afficher la valeur brute pour l'édition
    const numValue = parseCurrency(displayValue);
    if (numValue === 0) {
      setDisplayValue(''); // Afficher un champ vide si la valeur est 0
    } else {
      // Conserver le signe négatif et formater avec virgule
      const formattedValue = numValue.toString().replace('.', ',');
      setDisplayValue(formattedValue);
    }
    e.target.select(); // Sélectionner tout le texte
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const numValue = parseCurrency(e.target.value);
    
    // Formater pour l'affichage seulement si la valeur n'est pas 0
    if (numValue === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrency(numValue));
    }
    
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
    
    // Si le champ est vide, permettre de commencer par un signe négatif
    if (inputValue === '-') {
      setDisplayValue('-');
      return;
    }
    
    // Permettre seulement les chiffres, virgules, points, espaces et le signe moins
    let sanitized = inputValue.replace(/[^0-9,.\-\s]/g, '');
    
    // Gérer le signe négatif : ne peut être qu'en première position
    const hasNegativeSign = sanitized.startsWith('-');
    if (hasNegativeSign) {
      // Supprimer tous les autres signes négatifs après le premier
      sanitized = '-' + sanitized.substring(1).replace(/-/g, '');
    } else {
      // Supprimer tous les signes négatifs si pas en première position
      sanitized = sanitized.replace(/-/g, '');
    }
    
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
    </div>
  );
}