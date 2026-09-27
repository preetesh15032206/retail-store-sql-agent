/**
 * Shared Type Definitions for AI Database Agent
 */

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignKeyRef?: {
    table: string;
    column: string;
  };
  description?: string;
}

export interface TableSchema {
  name: string;
  description?: string;
  rowCount?: number;
  columns: ColumnSchema[];
  primaryKeys: string[];
  foreignKeys: Array<{
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
}

export interface DatabaseSchema {
  databaseName: string;
  engine: 'builtin-relational' | 'mysql';
  tables: TableSchema[];
  relationshipsDescription?: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter' | 'table';

export interface QueryPlan {
  sql: string;
  reasoning_summary: string;
  tables_used: string[];
  columns_used: string[];
  visualization_type: ChartType;
  confidence: 'high' | 'medium' | 'low';
  category?: string;
  chartConfig?: {
    xColumn?: string;
    yColumn?: string;
    groupByColumn?: string;
    title?: string;
  };
}

export interface ValidationRuleCheck {
  id: string;
  name: string;
  passed: boolean;
  details?: string;
}

export interface ValidationResult {
  isValid: boolean;
  isReadOnly: boolean;
  sanitizedSql: string;
  errors: string[];
  warnings: string[];
  ruleChecks: ValidationRuleCheck[];
  tablesDetected: string[];
  columnsDetected: string[];
  hasLimit: boolean;
  injectedLimit?: number;
}

export interface QueryResultAnalysis {
  rowCount: number;
  columnCount: number;
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  summaryStats?: Record<string, {
    total?: number;
    average?: number;
    min?: number;
    max?: number;
  }>;
  suggestedChartType: ChartType;
  xColumn?: string;
  yColumn?: string;
}

export interface ExecutionResult {
  success: boolean;
  sql: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  analysis?: QueryResultAnalysis;
  database: string;
  engine: 'builtin-relational' | 'mysql';
}

export interface QueryExplanation {
  userIntent: string;
  tablesUsed: { table: string; purpose: string }[];
  joinsApplied: string[];
  filtersApplied: string[];
  aggregations: string[];
  groupingAndSorting: string[];
  businessInsight: string;
  plainEnglishSummary: string;
}

export interface QueryHistoryItem {
  id: string;
  timestamp: string;
  question: string;
  sql: string;
  success: boolean;
  executionTimeMs: number;
  rowCount: number;
  error?: string;
  tablesUsed: string[];
  chartType?: ChartType;
}

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}
