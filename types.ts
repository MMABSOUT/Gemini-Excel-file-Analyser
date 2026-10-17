export type CellValue = string | number | boolean | Date | null;

export interface DataRow {
  [key: string]: CellValue;
}

export type ColumnType = 'numeric' | 'categorical' | 'text' | 'date' | 'boolean' | 'empty';

export interface HistogramBin {
  label: string;
  start: number;
  end: number;
  count: number;
}

export interface ValueCount {
  value: string;
  count: number;
  percent: number;
}

export interface NumericStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  q1: number;
  q3: number;
  sum: number;
  skewness: number;
  outliers: number;
  zeros: number;
  negatives: number;
  histogram: HistogramBin[];
}

export interface TimelinePoint {
  label: string;
  count: number;
}

export interface DateStats {
  min: Date;
  max: Date;
  spanDays: number;
  timeline: TimelinePoint[];
}

export interface ColumnStats {
  name: string;
  type: ColumnType;
  count: number;
  missing: number;
  missingPercent: number;
  unique: number;
  uniquePercent: number;
  topValues: ValueCount[];
  avgLength?: number;
  numeric?: NumericStats;
  date?: DateStats;
}

export interface CorrelationPair {
  a: string;
  b: string;
  r: number;
  n: number;
}

export interface CorrelationResult {
  columns: string[];
  matrix: (number | null)[][];
  topPairs: CorrelationPair[];
}

export interface DatasetStats {
  rowCount: number;
  colCount: number;
  totalCells: number;
  missingCells: number;
  completeness: number;
  duplicateRows: number;
  typeCounts: Record<ColumnType, number>;
  columns: ColumnStats[];
  correlations: CorrelationResult;
}

export interface AiRelationship {
  source: string;
  target: string;
  type: string;
  insight: string;
}

export interface AiInsightsResult {
  summary: string;
  keyTakeaways: string[];
  relationships: AiRelationship[];
  recommendations: string[];
}

export interface LoadedFile {
  name: string;
  size: number;
  sheetNames: string[];
}

export type TabId = 'overview' | 'columns' | 'correlations' | 'data' | 'ai';
