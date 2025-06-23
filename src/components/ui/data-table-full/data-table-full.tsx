import React, { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import { FileX } from 'lucide-react';
import styles from './data-table-full.module.css';
import { TableOptions } from './table-options';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';
import { EmptyState } from './empty-state';
import { MotherRow } from './mother-row';
import { ChildRow } from './child-row';

export interface Column<T> {
  label: string;
  accessor: keyof T;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface Action<T> {
  label: string;
  icon: 'edit' | 'delete';
  onClick: (row: T) => void;
  color?: string;
}

export interface DataTableFullProps<T, U> {
  motherColumns: Column<T>[];
  childColumns: Column<U>[];
  data: T[];
  loadChildren: (row: T) => Promise<U[]>;
  actions?: Action<T>[];
  childActions?: Action<U>[];
  duplicateMotherRowsForExport?: boolean;
  compact?: boolean;
  showSubtotals?: boolean;
  showInlineSubtotals?: boolean;
  rowsPerPageOptions?: (number | 'all')[];
  defaultRowsPerPage?: number;
  className?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function DataTableFull<T extends { id: string | number }, U extends { id: string | number }>({
  motherColumns,
  childColumns,
  data,
  loadChildren,
  actions,
  childActions,
  duplicateMotherRowsForExport = false,
  compact = false,
  showSubtotals = false,
  showInlineSubtotals = false,
  rowsPerPageOptions = [10, 25, 50, 'all'],
  defaultRowsPerPage = 10,
  className = '',
  emptyTitle = 'Aucune donnée',
  emptyMessage = 'Aucune donnée à afficher pour le moment',
}: DataTableFullProps<T, U>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [childrenMap, setChildrenMap] = useState<Map<string | number, U[]>>(new Map());
  const [loadingMap, setLoadingMap] = useState<Map<string | number, boolean>>(new Map());
  const [isDuplicateMotherRows, setIsDuplicateMotherRows] = useState<boolean>(duplicateMotherRowsForExport);
  const [isShowSubtotal, setIsShowSubtotal] = useState<boolean>(showSubtotals);

  // Réinitialiser l'état du composant quand l'option de duplication change
  useEffect(() => {
    // Forcer un re-rendu complet du tableau quand l'option change
    // pour s'assurer que toutes les cellules sont correctement mises à jour
    const forceRerender = async () => {
      // Créer une copie temporaire des données enfants
      const tempChildrenMap = new Map(childrenMap);
      
      // Vider la map pour forcer le rechargement
      setChildrenMap(new Map());
      
      // Réappliquer les données après un court délai
      setTimeout(() => {
        setChildrenMap(tempChildrenMap);
      }, 50);
    };
    
    forceRerender();
  }, [isDuplicateMotherRows]);
  
  // Réinitialiser l'état du composant quand l'option de sous-total change
  useEffect(() => {
    // Forcer un re-rendu complet du tableau quand l'option change
    const forceRerender = async () => {
      // Créer une copie temporaire des données enfants
      const tempChildrenMap = new Map(childrenMap);
      
      // Vider la map pour forcer le rechargement
      setChildrenMap(new Map());
      
      // Réappliquer les données après un court délai
      setTimeout(() => {
        setChildrenMap(tempChildrenMap);
      }, 50);
    };
    
    forceRerender();
  }, [isShowSubtotal]);

  // Tri des données
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return rowsPerPage === -1 ? sortedData : sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(data.length / rowsPerPage);

  // Gestionnaires d'événements
  const handleSort = useCallback((column: Column<T>) => {
    if (!column.sortable) return;

    setSortConfig(current => ({
      key: column.accessor,
      direction: current.key === column.accessor && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  }, []);

  const fetchChildrenForRow = useCallback(async (row: T) => {
    const rowId = row.id;
    
    // Marquer comme en cours de chargement
    setLoadingMap(prev => new Map(prev).set(rowId, true));
    
    try {
      const children = await loadChildren(row);
      // Stocker les données enfants brutes, sans ajouter de sous-total
      // Les sous-totaux seront ajoutés dynamiquement lors du rendu
      setChildrenMap(prev => new Map(prev).set(rowId, children));
    } catch (error) {
      console.error(`Erreur lors du chargement des données enfants pour la ligne ${rowId}:`, error);
      setChildrenMap(prev => new Map(prev).set(rowId, []));
    } finally {
      setLoadingMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(rowId);
        return newMap;
      });
    }
  }, [loadChildren]);

  // Précharger les données enfants pour toutes les lignes visibles
  useEffect(() => {
    const loadAllVisibleChildren = async () => {
      for (const row of paginatedData) {
        await fetchChildrenForRow(row);
      }
    };
    
    loadAllVisibleChildren();
  }, [paginatedData, fetchChildrenForRow]);

  // Calculer les sous-totaux pour les lignes enfants
  const calculateSubtotals = useCallback((childRows: U[]) => {
    if (!childRows || childRows.length === 0) return null;
    
    const subtotals: any = {};
    
    // Initialiser les sous-totaux avec des valeurs à 0 pour toutes les colonnes numériques
    childColumns.forEach(column => {
      const sampleValue = childRows[0][column.accessor];
      if (typeof sampleValue === 'number') {
        subtotals[column.accessor] = 0;
      } else {
        subtotals[column.accessor] = null;
      }
    });
    
    // Calculer les sous-totaux pour chaque colonne numérique
    childRows.forEach(row => {
      childColumns.forEach(column => {
        const value = row[column.accessor];
        if (typeof value === 'number') {
          subtotals[column.accessor] += value;
        }
      });
    });
    
    return subtotals;
  }, [childColumns]);

  const displayedRange = useMemo(() => {
    if (rowsPerPage === -1) {
      return `Tous les ${data.length} résultats`;
    }
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, data.length);
    return `${start} - ${end} sur ${data.length} résultats`;
  }, [currentPage, rowsPerPage, data.length]);

  const shouldShowPagination = data.length > 10;

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  // Préparer les données pour l'affichage
  const prepareDisplayData = () => {
    const displayRows: React.ReactNode[] = [];

    paginatedData.forEach((motherRow, index) => {
      const rowId = motherRow.id;
      let childRows = childrenMap.get(rowId) || [];
      const isLoading = loadingMap.has(rowId);

      // Filtrer les lignes pour enlever les sous-totaux existants
      // (au cas où il y aurait des résidus de sous-totaux)
      childRows = childRows.filter(child => !(child as any).isSubtotalRow);

      let rowsToDisplay = [...childRows]; // Copie pour éviter de modifier l'original
      
      // Ajouter une ligne de sous-total si l'option est activée
      if (isShowSubtotal && childRows.length > 0) {
        const subtotals = calculateSubtotals(childRows);
        
        if (subtotals) {
          const subtotalRow = {
            ...subtotals,
            id: `subtotal-${rowId}-${Date.now()}`, // Identifiant unique avec timestamp
            isSubtotalRow: true
          } as unknown as U;
          
          // Ajouter des propriétés pour l'affichage
          if ('type_service' in subtotals) {
            (subtotalRow as any).type_service = {
              code: 'TOTAL',
              libelle: 'Total'
            };
          }
          
          if ('sous_categorie' in subtotals) {
            (subtotalRow as any).sous_categorie = {
              code: '',
              libelle: ''
            };
          }
          
          // Ajouter la ligne de sous-total en première position
          rowsToDisplay = [subtotalRow, ...childRows];
        }
      }

      // Utiliser le composant MotherRow pour les lignes sans enfants ou en chargement
      if (childRows.length === 0) {
        displayRows.push(
          <MotherRow
            key={`mother-${rowId}`}
            motherRow={motherRow}
            motherColumns={motherColumns}
            childColumns={childColumns}
            actions={actions}
            childActions={childActions}
            isLoading={isLoading}
            hasChildren={false}
          />
        );
      } else {
        // Utiliser rowsToDisplay qui peut contenir des sous-totaux
        rowsToDisplay.forEach((childRow, childIndex) => {
          const isFirstChild = childIndex === 0;
          
          // Afficher la ligne mère uniquement dans ces cas:
          // 1. C'est la première ligne enfant (toujours)
          // 2. Ce n'est pas la première ligne mais l'option de duplication est activée
          const showMotherRow = isFirstChild || (childIndex > 0 && isDuplicateMotherRows && (!showInlineSubtotals || !isFirstChild));
          
          displayRows.push(
            <ChildRow
              key={`row-${motherRow.id}-${childRow.id}`}
              motherRow={motherRow}
              childRow={childRow}
              motherColumns={motherColumns}
              childColumns={childColumns}
              actions={actions}
              childActions={childActions}
              showMotherRow={showMotherRow}
            />
          );
        });
      }
    });
    
    return displayRows;
  };

  return (
    <div className={className}>
      <TableOptions
        dataCount={data.length}
        isDuplicateMotherRows={isDuplicateMotherRows}
        setIsDuplicateMotherRows={setIsDuplicateMotherRows}
        isShowSubtotal={isShowSubtotal} 
        setIsShowSubtotal={(value) => {
          setIsShowSubtotal(value);
        }}
      />

      <div className={styles.tableContainer}>
        <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
          <TableHeader
            motherColumns={motherColumns}
            childColumns={childColumns}
            sortConfig={sortConfig}
            handleSort={handleSort}
            hasActions={!!actions}
            hasChildActions={!!childActions}
          />
          <tbody>
            {prepareDisplayData()}
          </tbody>
        </table>
      </div>

      {shouldShowPagination && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          displayedRange={displayedRange}
          handlePageChange={handlePageChange}
          handleRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </div>
  );
}