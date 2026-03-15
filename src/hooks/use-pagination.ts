'use client';

import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset page if it exceeds total (e.g. after filter change)
  const safePage = page > totalPages ? 1 : page;

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return {
    page: safePage,
    setPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
  };
}
