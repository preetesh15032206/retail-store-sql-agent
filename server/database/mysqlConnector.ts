import mysql, { Pool } from 'mysql2/promise';
import { DatabaseConnectionConfig, DatabaseSchema, ExecutionResult, TableSchema, ColumnSchema } from '../../shared/types.js';
import { SampleDatabase } from './sampleDatabase.js';

/**
 * External MySQL Connection Manager
 * Manages connection pooling, read-only session enforcement, schema introspection, and safe execution.
 */
export class MysqlConnector {
  private static pool: Pool | null = null;
  private static currentConfig: DatabaseConnectionConfig | null = null;
  private static cachedSchema: DatabaseSchema | null = null;

  public static async connect(config: DatabaseConnectionConfig): Promise<{ success: boolean; message: string; schema?: DatabaseSchema }> {
    try {
      // Close previous pool if active
      if (this.pool) {
        await this.disconnect();
      }

      // Create new connection pool with strict limits
      const pool = mysql.createPool({
        host: config.host || 'localhost',
        port: Number(config.port) || 3306,
        user: config.user,
        password: config.password || '',
        database: config.database,
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 10000,
        ssl: (config.host && (config.host.includes('tidbcloud.com') || config.host.includes('aivencloud.com') || Number(config.port) === 4000)) ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const connection = await pool.getConnection();
      try {
        // Enforce Read-Only session on MySQL 5.6.5+ / MySQL 8.0+ (skip or catch if server does not support it like TiDB)
        try {
          await connection.query('SET SESSION TRANSACTION READ ONLY');
        } catch (readOnlyErr) {
          // TiDB serverless or some MySQL variants do not allow SET SESSION TRANSACTION READ ONLY without noop flag
          console.warn('[MySQL] SET SESSION TRANSACTION READ ONLY skipped:', (readOnlyErr as any).message);
        }
        await connection.query('SELECT 1 as ping');
      } finally {
        connection.release();
      }

      this.pool = pool;
      this.currentConfig = { ...config, password: '' }; // Strip password from stored memory

      // Introspect Schema dynamically
      const schema = await this.introspectSchema(config.database);
      this.cachedSchema = schema;

      console.log(`[MySQL] Successfully connected to database '${config.database}' at ${config.host}:${config.port}`);
      return {
        success: true,
        message: `Connected successfully to MySQL database '${config.database}'. Discovered ${schema.tables.length} tables.`,
        schema
      };
    } catch (err: any) {
      console.error('[MySQL] Connection failed:', err.message);
      return {
        success: false,
        message: `Failed to connect to MySQL: ${err.message}`
      };
    }
  }

  public static async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch (e) {
        // ignore
      }
      this.pool = null;
      this.currentConfig = null;
      this.cachedSchema = null;
      console.log('[MySQL] Connection pool closed.');
    }
  }

  public static isConnected(): boolean {
    return this.pool !== null;
  }

  public static getConfig(): Partial<DatabaseConnectionConfig> | null {
    return this.currentConfig;
  }

  public static async getSchema(): Promise<DatabaseSchema | null> {
    if (!this.pool || !this.currentConfig) return null;
    if (this.cachedSchema) return this.cachedSchema;

    this.cachedSchema = await this.introspectSchema(this.currentConfig.database);
    return this.cachedSchema;
  }

  public static async introspectSchema(databaseName: string): Promise<DatabaseSchema> {
    if (!this.pool) {
      throw new Error('MySQL connection pool is not active.');
    }

    const connection = await this.pool.getConnection();
    try {
      // 1. Get all tables in database
      const [tableRows]: any = await connection.query(`
        SELECT TABLE_NAME, TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `, [databaseName]);

      const tables: TableSchema[] = [];

      for (const t of tableRows) {
        const tableName = t.TABLE_NAME;

        // 2. Get columns for table
        const [colRows]: any = await connection.query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [databaseName, tableName]);

        // 3. Get row count estimation
        let rowCount = 0;
        try {
          const [countResult]: any = await connection.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
          if (countResult && countResult[0]) {
            rowCount = Number(countResult[0].cnt);
          }
        } catch {
          // fallback ignore
        }

        // 4. Get Foreign Keys
        const [fkRows]: any = await connection.query(`
          SELECT 
            COLUMN_NAME, 
            REFERENCED_TABLE_NAME, 
            REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [databaseName, tableName]);

        const primaryKeys: string[] = [];
        const columns: ColumnSchema[] = colRows.map((col: any) => {
          const isPk = col.COLUMN_KEY === 'PRI';
          if (isPk) primaryKeys.push(col.COLUMN_NAME);

          const fkMatch = fkRows.find((f: any) => f.COLUMN_NAME === col.COLUMN_NAME);

          return {
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE.toUpperCase(),
            nullable: col.IS_NULLABLE === 'YES',
            isPrimaryKey: isPk,
            isForeignKey: !!fkMatch,
            foreignKeyRef: fkMatch ? {
              table: fkMatch.REFERENCED_TABLE_NAME,
              column: fkMatch.REFERENCED_COLUMN_NAME
            } : undefined,
            description: col.COLUMN_COMMENT || undefined
          };
        });

        const foreignKeys = fkRows.map((f: any) => ({
          column: f.COLUMN_NAME,
          referencedTable: f.REFERENCED_TABLE_NAME,
          referencedColumn: f.REFERENCED_COLUMN_NAME
        }));

        tables.push({
          name: tableName,
          description: t.TABLE_COMMENT || undefined,
          rowCount,
          columns,
          primaryKeys,
          foreignKeys
        });
      }

      // Generate relationships description summary
      let relationshipsDescription = 'DETECTED FOREIGN KEY RELATIONSHIPS:\n';
      let hasRels = false;
      for (const t of tables) {
        for (const fk of t.foreignKeys) {
          hasRels = true;
          relationshipsDescription += `- ${t.name}.${fk.column} references ${fk.referencedTable}.${fk.referencedColumn}\n`;
        }
      }
      if (!hasRels) relationshipsDescription += 'No foreign keys declared in INFORMATION_SCHEMA.';

      return {
        databaseName,
        engine: 'mysql',
        tables,
        relationshipsDescription
      };
    } finally {
      connection.release();
    }
  }

  public static async executeQuery(sql: string): Promise<ExecutionResult> {
    if (!this.pool || !this.currentConfig) {
      throw new Error('MySQL connection pool is not active.');
    }

    const startTime = Date.now();
    const connection = await this.pool.getConnection();

    try {
      // Re-enforce read-only transaction mode if supported
      try {
        await connection.query('SET SESSION TRANSACTION READ ONLY');
      } catch (e) {
        // Ignored for databases like TiDB where app-layer AST validator enforces read-only
      }

      // Execute query with timeout
      const [rows, fields]: any = await connection.query({
        sql,
        timeout: 5000 // 5 seconds max timeout
      });

      const executionTimeMs = Date.now() - startTime;
      const rowList: Record<string, any>[] = Array.isArray(rows) ? rows : [];
      const columns = fields ? fields.map((f: any) => f.name) : (rowList.length > 0 ? Object.keys(rowList[0]) : []);

      const analysis = SampleDatabase.analyzeDataset(rowList, columns);

      return {
        success: true,
        sql,
        columns,
        rows: rowList,
        rowCount: rowList.length,
        executionTimeMs,
        analysis,
        database: this.currentConfig.database,
        engine: 'mysql'
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return {
        success: false,
        sql,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        error: err.message || 'MySQL execution error',
        database: this.currentConfig.database,
        engine: 'mysql'
      };
    } finally {
      connection.release();
    }
  }
}
