import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface CollapseToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Composant pour afficher une flèche de pliage/dépliage
 */
export function CollapseToggle({
  isExpanded,
  onToggle,
  size = 'sm',
  className = ''
}: CollapseToggleProps) {
  // Taille de l'icône en fonction de la taille du composant
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  
  // Classes CSS pour l'animation et le style
  const baseClasses = "transition-transform duration-200 cursor-pointer text-gray-600 hover:text-gray-900";
  
  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={isExpanded ? "Plier" : "Déplier"}
    >
      {isExpanded ? (
        <ChevronDown size={iconSize} />
      ) : (
        <ChevronRight size={iconSize} />
      )}
    </div>
  );
}