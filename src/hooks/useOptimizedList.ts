// src/hooks/useOptimizedList.ts

import { useMemo, useCallback, useState } from 'react';

/**
 * Configuration options for useOptimizedList hook.
 */
export interface OptimizedListOptions<T> {
  /** The full list of items */
  items: T[];
  /** Number of items to render per page (for pagination) */
  pageSize?: number;
  /** Initial page index (0-based) */
  initialPage?: number;
  /** Filter function to apply to items */
  filterFn?: (item: T) => boolean;
  /** Sort function to apply to items */
  sortFn?: (a: T, b: T) => number;
  /** Search term for simple text search (if items have string representation) */
  searchTerm?: string;
  /** Key to use for search (if items are objects) */
  searchKey?: keyof T;
}

/**
 * Return type for useOptimizedList hook.
 */
export interface OptimizedListResult<T> {
  /** The filtered, sorted, and paginated items (current page) */
  paginatedItems: T[];
  /** All filtered items (before pagination) */
  filteredItems: T[];
  /** Current page number (0-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Reset pagination to first page */
  resetPagination: () => void;
  /** Update filter function */
  setFilterFn: (fn?: (item: T) => boolean) => void;
  /** Update sort function */
  setSortFn: (fn?: (a: T, b: T) => number) => void;
  /** Update search term (simple text search) */
  setSearchTerm: (term: string) => void;
}

/**
 * A custom hook for efficiently handling lists with filtering, sorting, and pagination.
 * Memoizes expensive operations to avoid unnecessary re-renders.
 * 
 * @example
 * const { paginatedItems, totalPages, nextPage, prevPage } = useOptimizedList({
 *   items: allEmis,
 *   pageSize: 10,
 *   filterFn: (emi) => emi.status === 'unpaid',
 *   sortFn: (a, b) => a.dueDate.localeCompare(b.dueDate),
 * });
 */
export function useOptimizedList<T>({
  items,
  pageSize = 10,
  initialPage = 0,
  filterFn: initialFilterFn,
  sortFn: initialSortFn,
  searchTerm: initialSearchTerm = '',
  searchKey,
}: OptimizedListOptions<T>): OptimizedListResult<T> {
  // State for dynamic filtering/sorting/search
  const [filterFn, setFilterFn] = useState<(item: T) => boolean>(() => initialFilterFn || (() => true));
  const [sortFn, setSortFn] = useState<((a: T, b: T) => number) | undefined>(() => initialSortFn);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Memoize the filtered items
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search term if provided and searchKey exists
    if (searchTerm && searchKey) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => {
        const value = item[searchKey];
        return String(value).toLowerCase().includes(lowerSearch);
      });
    }

    // Apply custom filter function
    result = result.filter(filterFn);

    // Apply sorting
    if (sortFn) {
      result = [...result].sort(sortFn);
    }

    return result;
  }, [items, filterFn, sortFn, searchTerm, searchKey]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / pageSize));
  }, [filteredItems.length, pageSize]);

  // Ensure current page is within bounds when filtered items change
  useMemo(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  // Memoize paginated items for the current page
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, pageSize]);

  // Pagination handlers (memoized)
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.min(Math.max(0, page), totalPages - 1));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(0);
  }, []);

  return {
    paginatedItems,
    filteredItems,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    setFilterFn,
    setSortFn,
    setSearchTerm,
  };
}

export default useOptimizedList;