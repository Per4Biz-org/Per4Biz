import React from 'react';
import { Button } from '../button';
import styles from './data-table-full.module.css';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  rowsPerPageOptions: (number | 'all')[];
  displayedRange: string;
  handlePageChange: (page: number) => void;
  handleRowsPerPageChange: (rowsPerPage: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  rowsPerPageOptions,
  displayedRange,
  handlePageChange,
  handleRowsPerPageChange
}: TablePaginationProps) {
  return (
    <div className={styles.pagination}>
      <div className={styles.paginationInfo}>
        {displayedRange}
      </div>

      <div className={styles.paginationControls}>
        <Button
          size="sm"
          icon="ChevronsLeft"
          label=""
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        />
        <Button
          size="sm"
          icon="ChevronLeft"
          label=""
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
      
        <select
          className="mx-2 px-2 py-1 border rounded"
          value={rowsPerPage === -1 ? 'all' : rowsPerPage}
          onChange={(e) => handleRowsPerPageChange(e.target.value === 'all' ? -1 : Number(e.target.value))}
        >
          {rowsPerPageOptions.map(option => (
            <option key={option} value={option === 'all' ? 'all' : option}>
              {option === 'all' ? 'Tout afficher' : `${option} par page`}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          icon="ChevronRight"
          label=""
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Button
          size="sm"
          icon="ChevronsRight"
          label=""
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </div>
    </div>
  );
}