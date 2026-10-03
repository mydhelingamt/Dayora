export interface QueryResult<T = unknown> {
  rowsAffected: number;
  insertId?: number;
  rows: T[];
}

export interface Migration {
  version: number;
  name: string;
  up: string[];
}

export interface DatabaseClient {
  initialize(): Promise<void>;
  execute<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  executeTransaction(queries: Array<{ sql: string; params?: unknown[] }>): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
}
