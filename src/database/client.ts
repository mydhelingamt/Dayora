import { DatabaseClient, QueryResult } from './types';
import { runMigrations } from './migrations';

let opSqliteModule: any = null;
try {
  // Dynamic require ensures Jest and node environments don't crash if native binary is absent
  opSqliteModule = require('@op-engineering/op-sqlite');
} catch {
  opSqliteModule = null;
}

export class SqliteDatabaseClient implements DatabaseClient {
  private db: any = null;
  private initialized: boolean = false;
  private readonly dbName: string;

  constructor(dbName: string = 'dayora.db') {
    this.dbName = dbName;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (opSqliteModule && typeof opSqliteModule.open === 'function') {
      this.db = opSqliteModule.open({ name: this.dbName });
      try {
        await this.db.execute('PRAGMA journal_mode = WAL;');
        await this.db.execute('PRAGMA synchronous = NORMAL;');
        await this.db.execute('PRAGMA cache_size = -2000;');
        await this.db.execute('PRAGMA temp_store = MEMORY;');
      } catch {
        // Suppress pragma errors in constrained or mock environments
      }
    } else {
      // In-memory fallback for testing / headless environments
      this.db = this.createFallbackClient();
    }

    this.initialized = true;
    await runMigrations(this);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async execute<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (!this.initialized || !this.db) {
      throw new Error('DatabaseClient is not initialized. Call initialize() first.');
    }

    try {
      const result = await this.db.execute(sql, params);
      const rows: T[] = result?.rows?._array || result?.rows || [];
      return {
        rowsAffected: result?.rowsAffected ?? 0,
        insertId: result?.insertId,
        rows,
      };
    } catch (error) {
      throw new Error(`Database execute failed: ${(error as Error).message} | SQL: ${sql}`);
    }
  }

  public async executeTransaction(
    queries: Array<{ sql: string; params?: unknown[] }>
  ): Promise<void> {
    if (!this.initialized || !this.db) {
      throw new Error('DatabaseClient is not initialized. Call initialize() first.');
    }

    try {
      if (typeof this.db.executeBatch === 'function') {
        const batchCommands = queries.map((q) => [q.sql, q.params || []]);
        await this.db.executeBatch(batchCommands);
      } else {
        await this.db.execute('BEGIN TRANSACTION;');
        for (const { sql, params } of queries) {
          await this.db.execute(sql, params || []);
        }
        await this.db.execute('COMMIT;');
      }
    } catch (error) {
      try {
        await this.db.execute('ROLLBACK;');
      } catch {
        // Suppress rollback failure if transaction was not opened
      }
      throw new Error(`Transaction failed: ${(error as Error).message}`);
    }
  }

  public async close(): Promise<void> {
    if (this.db && typeof this.db.close === 'function') {
      await this.db.close();
    }
    this.db = null;
    this.initialized = false;
  }

  private createFallbackClient() {
    // Lightweight mock runner for Jest unit tests without native binary
    return {
      execute: async (_sql: string, _params: unknown[]) => ({
        rowsAffected: 0,
        rows: [],
      }),
      executeBatch: async (_commands: any[]) => {},
      close: async () => {},
    };
  }
}

export const databaseClient: DatabaseClient = new SqliteDatabaseClient();
