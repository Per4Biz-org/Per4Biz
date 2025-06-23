import React from 'react';
import { Toggle } from '../toggle';
import styles from './data-table-full.module.css';

interface TableOptionsProps {
  dataCount: number;
  isDuplicateMotherRows: boolean;
  setIsDuplicateMotherRows: React.Dispatch<React.SetStateAction<boolean>>;
  isShowSubtotal: boolean;
  setIsShowSubtotal: (value: boolean) => void;
}

export function TableOptions({
  dataCount,
  isDuplicateMotherRows,
  setIsDuplicateMotherRows,
  isShowSubtotal,
  setIsShowSubtotal
}: TableOptionsProps) {
  return (
    <div className={styles.dataCount}>
      {dataCount} {dataCount > 1 ? 'éléments' : 'élément'}
      
      <div className="flex items-center gap-6 mt-2 mb-2 flex-wrap">
        <Toggle
          checked={isDuplicateMotherRows}
          onChange={(checked) => {
            setIsDuplicateMotherRows(checked);
          }}
          label="Dupliquer lignes mères"
          icon="Copy"
          size="sm"
        />
        <Toggle
          checked={isShowSubtotal}
          onChange={setIsShowSubtotal}
          label="Afficher Sous-total"
          icon="Calculator"
          size="sm"
        />
      </div>
    </div>
  );
}