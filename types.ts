export type DataValue = string | number | boolean | Date | null;

export interface DataRow {
  [key: string]: DataValue;
}

export enum ColumnType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  distinctCount: number;
  min?: number;
  max?: number;
  sum?: number;
  avg?: number;
  nullCount: number;
  exampleValues: DataValue[];
}

export interface Dataset {
  name: string;
  rows: DataRow[];
  columns: ColumnProfile[];
  totalRows: number;
}

export interface KPI {
  label: string;
  value: string;
  trend?: number; // percentage
  trendLabel?: string;
  color?: 'green' | 'red' | 'blue' | 'gray';
}

export interface AIAnalysis {
  trends: string[];
  anomalies: string[];
  opportunities: string[];
  recommendations: string[];
}
