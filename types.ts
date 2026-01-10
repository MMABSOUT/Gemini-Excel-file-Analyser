
export interface DataRow {
  [key: string]: any;
}

export interface ChartSuggestion {
  type: 'bar' | 'line' | 'scatter' | 'area' | 'pie';
  title: string;
  xAxis: string;
  yAxis: string;
  description: string;
}

export interface DataRelationship {
  source: string;
  target: string;
  type: string;
  strength: number;
  insight: string;
}

export interface AnalysisResult {
  summary: string;
  keyTakeaways: string[];
  charts: ChartSuggestion[];
  relationships: DataRelationship[];
  statistics: {
    rowCount: number;
    colCount: number;
    columnDetails: {
      name: string;
      type: 'numeric' | 'categorical' | 'date';
      missingValues: number;
    }[];
  };
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING_FILE = 'LOADING_FILE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ERROR = 'ERROR'
}
