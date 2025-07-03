import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { BudgetRHLine } from './BudgetRHLine';
import { BudgetRHTableHeader } from './BudgetRHTableHeader';
import { BudgetRHFooter } from './BudgetRHFooter';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';
import styles from './styles.module.css';

interface BudgetTableRHProps {
  data: BudgetData[];
  year: number;
}

export function BudgetTableRH({ data, year }: BudgetTableRHProps) {
  // Mois de l'année
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];
  
  // États pour le pliage/dépliage
  const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(new Set());
  const [collapsedFunctions, setCollapsedFunctions] = useState<Set<string>>(new Set());
  const [collapsedPersonnel, setCollapsedPersonnel] = useState<Set<string>>(new Set()); 
  
  // Par défaut, toutes les sous-catégories sont pliées
  const [expandedPersonnel, setExpandedPersonnel] = useState<Set<string>>(new Set());
  
  // Gestionnaires pour plier/déplier
  const toggleEntity = (entityId: string) => {
    setCollapsedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };
  
  const toggleFunction = (functionId: string) => {
    setCollapsedFunctions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(functionId)) {
        newSet.delete(functionId);
      } else {
        newSet.add(functionId);
      }
      return newSet;
    });
  };
  
  const togglePersonnel = (personnelId: string) => {
    // Pour les sous-catégories, on utilise un état d'expansion plutôt que de collapse
    setExpandedPersonnel(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personnelId)) {
        newSet.delete(personnelId);
      } else {
        newSet.add(personnelId);
      }
      return newSet;
    });
  };
  
  // Organiser les données pour l'affichage
  const organizedData = React.useMemo(() => {
    // Grouper par entité
    const entitiesMap = new Map<string, BudgetData[]>();
    
    data.forEach(row => {
      const entityKey = row.entite_id;
      if (!entitiesMap.has(entityKey)) {
        entitiesMap.set(entityKey, []);
      }
      entitiesMap.get(entityKey)?.push(row);
    });
    
    // Préparer les données organisées
    const organized: BudgetData[] = [];
    
    // Pour chaque entité
    entitiesMap.forEach((entityRows, entityId) => {
      // Ajouter la ligne d'entité (type 'entite')
      const entityRow = entityRows.find(row => row.type === 'entite');
      if (entityRow) {
        organized.push(entityRow);
      }
      
      // Si l'entité n'est pas pliée, ajouter ses fonctions et personnel
      if (!collapsedEntities.has(entityId)) {
        // Grouper par fonction
        const functionsMap = new Map<string, BudgetData[]>();
        
        entityRows.filter(row => row.type !== 'entite').forEach(row => {
          const functionKey = row.fonction_id || '';
          if (!functionsMap.has(functionKey)) {
            functionsMap.set(functionKey, []);
          }
          functionsMap.get(functionKey)?.push(row);
        });
        
        // Pour chaque fonction
        functionsMap.forEach((functionRows, functionId) => {
          // Ajouter la ligne de fonction (type 'fonction')
          const functionRow = functionRows.find(row => row.type === 'fonction');
          if (functionRow) {
            organized.push(functionRow);
          }
          
          // Si la fonction n'est pas pliée, ajouter son personnel
          if (!collapsedFunctions.has(functionId)) {
            // Grouper par personnel
            const personnelMap = new Map<string, BudgetData[]>();
            
            functionRows.filter(row => row.type !== 'fonction').forEach(row => {
              const personnelKey = row.personnel_id || '';
              if (!personnelMap.has(personnelKey)) {
                personnelMap.set(personnelKey, []);
              }
              personnelMap.get(personnelKey)?.push(row);
            });
            
            // Pour chaque personnel
            personnelMap.forEach((personnelRows, personnelId) => {
              // Ajouter la ligne de personnel (type 'personnel')
              const personnelRow = personnelRows.find(row => row.type === 'personnel');
              if (personnelRow) {
                organized.push(personnelRow);
              }
              
              // Si le personnel est déplié, ajouter ses sous-catégories
              if (expandedPersonnel.has(personnelId)) {
                // Ajouter toutes les sous-catégories (type 'sous_categorie')
                personnelRows.filter(row => row.type === 'sous_categorie').forEach(row => {
                  organized.push(row);
                });
              }
            });
          }
        });
      }
    });
    
    return organized;
  }, [data, collapsedEntities, collapsedFunctions, expandedPersonnel]);
  
  // Rendu du composant
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <BudgetRHTableHeader months={months} />
        </thead>
        <tbody>
          {organizedData.map((row, index) => (
            <BudgetRHLine 
              key={`${row.type}-${row.entite_id}-${row.fonction_id || ''}-${row.personnel_id || ''}-${row.sous_categorie_id || ''}`}
              data={row}
              months={months}
              isCollapsed={
                (row.type === 'entite' && collapsedEntities.has(row.entite_id)) ||
                (row.type === 'fonction' && collapsedFunctions.has(row.fonction_id || ''))
              }
              isExpanded={
                row.type === 'personnel' && expandedPersonnel.has(row.personnel_id || '')
              }
              onToggle={() => {
                if (row.type === 'entite') {
                  toggleEntity(row.entite_id);
                } else if (row.type === 'fonction') {
                  toggleFunction(row.fonction_id || '');
                } else if (row.type === 'personnel') {
                  togglePersonnel(row.personnel_id || '');
                }
              }}
            />
          ))}
        </tbody>
        <tfoot>
          <BudgetRHFooter data={data} months={months} />
        </tfoot>
      </table>
    </div>
  );
}