import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
        <span className="text-sm text-gray-600">
          {displayedRange}
        </span>
      </div>

      <div className={styles.paginationControls}>
        <select
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          value={rowsPerPage === -1 ? 'all' : rowsPerPage}
          onChange={(e) => handleRowsPerPageChange(e.target.value === 'all' ? -1 : Number(e.target.value))}
        >
          {rowsPerPageOptions.map(option => (
            <option key={option} value={option === 'all' ? 'all' : option}>
              {option === 'all' ? 'Todos' : `${option}`}
            </option>
          ))}
        </select>

        <div className="flex items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="mx-3 text-sm text-gray-700">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}