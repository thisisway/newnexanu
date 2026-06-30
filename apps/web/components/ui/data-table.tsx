'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

import React from 'react'

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // Only show skeleton rows on the very first load (no data yet). On refetches
  // (filtering, pagination, refresh, after mutations) keep the existing rows
  // visible and just dim them — this avoids the whole table blinking.
  const isInitialLoading = loading && data.length === 0
  const isRefetching = loading && data.length > 0

  return (
    <div className={cn('relative w-full overflow-auto rounded-xl border border-border', className)}>
      {isRefetching && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 animate-progress-indeterminate bg-primary/70" />
        </div>
      )}
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'h-11 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(isRefetching && 'opacity-50 transition-opacity')}>
          {isInitialLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-0">
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/40',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-foreground', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-muted-foreground">
      <span>
        {total === 0 ? 'Nenhum resultado' : `${from}–${to} de ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="px-2 font-medium text-foreground">{page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>
    </div>
  )
}
