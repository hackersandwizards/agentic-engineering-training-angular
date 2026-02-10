import { signal } from '@angular/core';

export function createPagination(pageSize = 5) {
  const page = signal(1);
  const totalPages = signal(1);

  function updateFromResponse(count: number): void {
    totalPages.set(Math.max(1, Math.ceil(count / pageSize)));
  }

  function skip(): number {
    return (page() - 1) * pageSize;
  }

  function goToPage(p: number, loadFn: () => void): void {
    page.set(p);
    loadFn();
  }

  return {
    page: page.asReadonly(),
    totalPages: totalPages.asReadonly(),
    pageSize,
    skip,
    updateFromResponse,
    goToPage,
  };
}
