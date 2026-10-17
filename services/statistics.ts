import {
  CellValue,
  ColumnStats,
  ColumnType,
  CorrelationPair,
  CorrelationResult,
  DataRow,
  DatasetStats,
  DateStats,
  HistogramBin,
  NumericStats,
  TimelinePoint,
  ValueCount,
} from '../types';
import { formatCell, formatCompact } from './format';

const TYPE_THRESHOLD = 0.9;
const MAX_CORRELATION_COLUMNS = 15;
const DATE_PATTERN = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})([ T]\d{1,2}:\d{2}(:\d{2})?)?/;

const isMissing = (value: CellValue): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

export function toNumber(value: CellValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[,\s$€£¥]/g, '');
    if (cleaned === '') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toDate(value: CellValue): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && DATE_PATTERN.test(value.trim())) {
    const parsed = new Date(value.trim());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function detectType(present: CellValue[]): ColumnType {
  if (present.length === 0) return 'empty';
  let numeric = 0;
  let dates = 0;
  let booleans = 0;
  for (const value of present) {
    if (typeof value === 'boolean') booleans++;
    else if (value instanceof Date) dates++;
    else if (toNumber(value) !== null) numeric++;
    else if (toDate(value)) dates++;
  }
  const n = present.length;
  if (booleans / n >= TYPE_THRESHOLD) return 'boolean';
  if (dates / n >= TYPE_THRESHOLD) return 'date';
  if (numeric / n >= TYPE_THRESHOLD) return 'numeric';

  const unique = new Set(present.map((v) => formatCell(v).trim().toLowerCase())).size;
  if (unique <= Math.max(20, n * 0.05) || unique / n <= 0.5) return 'categorical';
  return 'text';
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base];
}

function buildHistogram(sorted: number[]): HistogramBin[] {
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  if (min === max) return [{ label: formatCompact(min), start: min, end: max, count: n }];

  const binCount = Math.min(20, Math.max(5, Math.ceil(Math.log2(n) + 1)));
  const width = (max - min) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * width;
    return { label: formatCompact(start), start, end: start + width, count: 0 };
  });
  for (const value of sorted) {
    const index = Math.min(binCount - 1, Math.floor((value - min) / width));
    bins[index].count++;
  }
  return bins;
}

function computeNumericStats(values: number[]): NumericStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  let sqDiff = 0;
  let cubeDiff = 0;
  let zeros = 0;
  let negatives = 0;
  for (const v of sorted) {
    const d = v - mean;
    sqDiff += d * d;
    cubeDiff += d * d * d;
    if (v === 0) zeros++;
    if (v < 0) negatives++;
  }
  const std = n > 1 ? Math.sqrt(sqDiff / (n - 1)) : 0;
  const popStd = Math.sqrt(sqDiff / n);
  const skewness = popStd > 0 ? cubeDiff / n / popStd ** 3 : 0;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowFence || v > highFence).length;

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median: quantile(sorted, 0.5),
    std,
    q1,
    q3,
    sum,
    skewness,
    outliers,
    zeros,
    negatives,
    histogram: buildHistogram(sorted),
  };
}

function computeDateStats(dates: Date[]): DateStats {
  const times = dates.map((d) => d.getTime()).sort((a, b) => a - b);
  const min = new Date(times[0]);
  const max = new Date(times[times.length - 1]);
  const spanDays = Math.round((max.getTime() - min.getTime()) / 86_400_000);

  const keyLength = spanDays > 365 * 3 ? 4 : spanDays > 62 ? 7 : 10;
  const buckets = new Map<string, number>();
  for (const t of times) {
    const key = new Date(t).toISOString().slice(0, keyLength);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const timeline: TimelinePoint[] = [...buckets.entries()].map(([label, count]) => ({ label, count }));
  return { min, max, spanDays, timeline };
}

function computeTopValues(present: CellValue[], limit = 10): ValueCount[] {
  const counts = new Map<string, number>();
  for (const value of present) {
    const key = formatCell(value).trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count, percent: (count / present.length) * 100 }));
}

function analyzeColumn(name: string, values: CellValue[]): ColumnStats {
  const present = values.filter((v) => !isMissing(v));
  const missing = values.length - present.length;
  const type = detectType(present);
  const unique = new Set(present.map((v) => formatCell(v).trim())).size;

  const stats: ColumnStats = {
    name,
    type,
    count: present.length,
    missing,
    missingPercent: values.length ? (missing / values.length) * 100 : 0,
    unique,
    uniquePercent: present.length ? (unique / present.length) * 100 : 0,
    topValues: computeTopValues(present),
  };

  if (type === 'numeric') {
    const nums = present.map(toNumber).filter((v): v is number => v !== null);
    if (nums.length) stats.numeric = computeNumericStats(nums);
  } else if (type === 'date') {
    const dates = present.map(toDate).filter((v): v is Date => v !== null);
    if (dates.length) stats.date = computeDateStats(dates);
  } else if (type === 'text' || type === 'categorical') {
    const totalLength = present.reduce<number>((acc, v) => acc + formatCell(v).length, 0);
    stats.avgLength = present.length ? totalLength / present.length : 0;
  }

  return stats;
}

function pearson(xs: (number | null)[], ys: (number | null)[]): { r: number; n: number } | null {
  let n = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const y = ys[i];
    if (x === null || y === null) continue;
    n++;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  if (n < 3) return null;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
  if (!denominator || !Number.isFinite(denominator)) return null;
  return { r: (n * sumXY - sumX * sumY) / denominator, n };
}

function computeCorrelations(rows: DataRow[], columns: ColumnStats[]): CorrelationResult {
  const numericColumns = columns
    .filter((c) => c.type === 'numeric' && c.numeric && c.numeric.std > 0)
    .slice(0, MAX_CORRELATION_COLUMNS)
    .map((c) => c.name);

  const vectors = numericColumns.map((name) => rows.map((row) => toNumber(row[name] ?? null)));
  const matrix: (number | null)[][] = numericColumns.map(() => numericColumns.map(() => null));
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < numericColumns.length; j++) {
      const result = pearson(vectors[i], vectors[j]);
      if (!result) continue;
      matrix[i][j] = result.r;
      matrix[j][i] = result.r;
      pairs.push({ a: numericColumns[i], b: numericColumns[j], r: result.r, n: result.n });
    }
  }

  pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  return { columns: numericColumns, matrix, topPairs: pairs.slice(0, 10) };
}

export function computeStatistics(rows: DataRow[], headers: string[]): DatasetStats {
  const columns = headers.map((header) => analyzeColumn(header, rows.map((row) => row[header] ?? null)));

  const typeCounts: Record<ColumnType, number> = {
    numeric: 0,
    categorical: 0,
    text: 0,
    date: 0,
    boolean: 0,
    empty: 0,
  };
  for (const column of columns) typeCounts[column.type]++;

  const totalCells = rows.length * headers.length;
  const missingCells = columns.reduce((acc, c) => acc + c.missing, 0);

  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const row of rows) {
    const key = JSON.stringify(headers.map((h) => formatCell(row[h] ?? null)));
    if (seen.has(key)) duplicateRows++;
    else seen.add(key);
  }

  return {
    rowCount: rows.length,
    colCount: headers.length,
    totalCells,
    missingCells,
    completeness: totalCells ? ((totalCells - missingCells) / totalCells) * 100 : 100,
    duplicateRows,
    typeCounts,
    columns,
    correlations: computeCorrelations(rows, columns),
  };
}

export function describeCorrelation(r: number): string {
  const abs = Math.abs(r);
  const direction = r >= 0 ? 'positive' : 'negative';
  if (abs >= 0.8) return `Very strong ${direction}`;
  if (abs >= 0.6) return `Strong ${direction}`;
  if (abs >= 0.4) return `Moderate ${direction}`;
  if (abs >= 0.2) return `Weak ${direction}`;
  return 'Negligible';
}
