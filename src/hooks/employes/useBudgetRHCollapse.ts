import { useState, useCallback } from 'react';

// Types d'éléments pouvant être pliés/dépliés
export type CollapseItemType = 'entite' | 'fonction' | 'personnel' | 'sous_categorie';

// Interface pour l'état de pliage
export interface CollapseState {
  [id: string]: boolean; // true = déplié, false = plié
}

/**
 * Hook pour gérer l'état de pliage/dépliage des éléments du tableau Budget RH
 * @param initialState État initial (optionnel)
 * @returns État de pliage et fonctions pour le manipuler
 */
export function useBudgetRHCollapse(initialState: CollapseState = {}) {
  // État de pliage/dépliage
  const [collapseState, setCollapseState] = useState<CollapseState>(() => {
    // Par défaut, les entités et fonctions sont dépliées, les employés et sous-catégories sont pliées
    const defaultState: CollapseState = {
      ...initialState
    };
    return defaultState;
  });

  /**
   * Vérifie si un élément est déplié
   * @param id Identifiant de l'élément
   * @param defaultValue Valeur par défaut si l'élément n'est pas dans l'état
   * @returns true si l'élément est déplié, false sinon
   */
  const isExpanded = useCallback((id: string, defaultValue: boolean = false): boolean => {
    return id in collapseState ? collapseState[id] : defaultValue;
  }, [collapseState]);

  /**
   * Inverse l'état de pliage d'un élément
   * @param id Identifiant de l'élément
   */
  const toggleCollapse = useCallback((id: string) => {
    setCollapseState(prevState => ({
      ...prevState,
      [id]: !(id in prevState ? prevState[id] : false)
    }));
  }, []);

  /**
   * Déplie un élément
   * @param id Identifiant de l'élément
   */
  const expandItem = useCallback((id: string) => {
    setCollapseState(prevState => ({
      ...prevState,
      [id]: true
    }));
  }, []);

  /**
   * Plie un élément
   * @param id Identifiant de l'élément
   */
  const collapseItem = useCallback((id: string) => {
    setCollapseState(prevState => ({
      ...prevState,
      [id]: false
    }));
  }, []);

  /**
   * Initialise l'état de pliage pour un ensemble d'éléments
   * @param data Données du budget
   */
  const initializeCollapseState = useCallback((data: any[]) => {
    const newState: CollapseState = {};
    
    // Parcourir les données pour initialiser l'état
    data.forEach(item => {
      if (item.type === 'entite') {
        // Les entités sont dépliées par défaut
        newState[`entite-${item.entite_id}`] = true;
      } else if (item.type === 'fonction') {
        // Les fonctions sont dépliées par défaut
        newState[`fonction-${item.entite_id}-${item.fonction_id}`] = true;
      } else if (item.type === 'personnel') {
        // Les employés sont pliés par défaut (leurs sous-catégories sont masquées)
        newState[`personnel-${item.entite_id}-${item.fonction_id}-${item.personnel_id}`] = false;
      }
    });
    
    setCollapseState(newState);
  }, []);

  return {
    collapseState,
    isExpanded,
    toggleCollapse,
    expandItem,
    collapseItem,
    initializeCollapseState
  };
}