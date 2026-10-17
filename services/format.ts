import { CellValue, ColumnType } from '../types';

const compactFormatter = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1e6) return compactFormatter.format(value);
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return compactFormatter.format(value);
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatCell(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : formatDate(value);
  return String(value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const TYPE_LABELS: Record<ColumnType, string> = {
  numeric: 'Numeric',
  categorical: 'Categorical',
  text: 'Text',
  date: 'Date',
  boolean: 'Boolean',
  empty: 'Empty',
};

export const TYPE_COLORS: Record<ColumnType, string> = {
  numeric: '#2563eb',
  categorical: '#059669',
  text: '#64748b',
  date: '#7c3aed',
  boolean: '#d97706',
  empty: '#dc2626',
};
