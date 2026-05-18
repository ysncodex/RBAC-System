'use client';

import { ReactNode } from 'react';

import { DataCard } from '@/components/shared/data-card';
import { DataTable } from '@/components/shared/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ResponsiveTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  mobileLabel: string;
  mobileValue: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  rows: T[];
  columns: ResponsiveTableColumn<T>[];
  getRowKey: (row: T) => string;
  mobileHeader?: (row: T) => ReactNode;
}

export function ResponsiveTable<T>({
  rows,
  columns,
  getRowKey,
  mobileHeader,
}: ResponsiveTableProps<T>) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <DataCard
            key={getRowKey(row)}
            header={mobileHeader?.(row)}
            fields={columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => ({
                label: column.mobileLabel,
                value: column.mobileValue(row),
              }))}
          />
        ))}
      </div>

      <div className="hidden lg:block">
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.header} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.header} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      </div>
    </>
  );
}
