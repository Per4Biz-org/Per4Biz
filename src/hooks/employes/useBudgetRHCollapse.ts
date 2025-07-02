import { useState, useCallback } from 'react';

// Types d'éléments pouvant être pliés/dépliés
type CollapseItemType = 'entite' | 'fonction' | 'personnel';

// Interface pour les identifiants des éléments
interface CollapseItemId {
  entiteId?: string;
  fonctionId?: string;
  personnelId?: string;
}

/**
 * Hook personnalisé pour gérer l'état de pliage/dépliage des éléments du budget RH
 */
export function useBudgetRHCollapse() {
  // État pour suivre les éléments pliés
  const [collapsedItems, setCollapsedItems] = useState<{
    entites: Set<string>;
    fonctions: Set<string>;
    personnel: Set<string>;
  }>({
    entites: new Set<string>(),
    fonctions: new Set<string>(),
    personnel: new Set<string>(),
  });

  /**
   * Vérifie si un élément est plié
   */
  const isCollapsed = useCallback(
    (type: CollapseItemType, id: string): boolean => {
      switch (type) {
        case 'entite':
          return collapsedItems.entites.has(id);
        case 'fonction':
          return collapsedItems.fonctions.has(id);
        case 'personnel':
          return collapsedItems.personnel.has(id);
        default:
          return false;
      }
    },
    [collapsedItems]
  );

  /**
   * Vérifie si un élément est plié en raison d'un parent plié
   */
  const isParentCollapsed = useCallback(
    (ids: CollapseItemId): boolean => {
      // Si l'entité parente est pliée, tout est plié
      if (ids.entiteId && collapsedItems.entites.has(ids.entiteId)) {
        return true;
      }
      
      // Si la fonction parente est pliée, le personnel et ses sous-catégories sont pliés
      if (ids.fonctionId && collapsedItems.fonctions.has(ids.fonctionId)) {
        return true;
      }
      
      return false;
    },
    [collapsedItems]
  );

  /**
   * Bascule l'état de pliage d'un élément
   */
  const toggleCollapse = useCallback(
    (type: CollapseItemType, id: string) => {
      setCollapsedItems((prev) => {
        const newState = { ...prev };
        const targetSet = new Set(prev[`${type}s` as keyof typeof prev]);
        
        if (targetSet.has(id)) {
          targetSet.delete(id);
        } else {
          targetSet.add(id);
        }
        
        return {
          ...newState,
          [`${type}s`]: targetSet,
        };
      });
    },
    []
  );

  /**
   * Initialise l'état de pliage par défaut
   */
  const initializeDefaultState = useCallback(() => {
    setCollapsedItems({
      entites: new Set<string>(),
      fonctions: new Set<string>(),
      // Par défaut, tous les personnels sont pliés (leurs sous-catégories sont masquées)
      personnel: new Set<string>(),
    });
  }, []);

  return {
    isCollapsed,
    isParentCollapsed,
    toggleCollapse,
    initializeDefaultState,
  };
}