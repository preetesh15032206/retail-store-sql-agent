import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { SampleDatabase } from './server/database/sampleDatabase.js';
import { MysqlConnector } from './server/database/mysqlConnector.js';
import { SqlValidator } from './server/security/sqlValidator.js';
import { GeminiProvider } from './server/ai/geminiProvider.js';
import { DatabaseConnectionConfig, DatabaseSchema } from './shared/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '2mb' }));

// Initialize sample relational database at boot
SampleDatabase.initialize();

// Automatically connect to external MySQL / TiDB if DB_HOST is set or if configured
if (process.env.DB_HOST && process.env.DB_USER) {
  MysqlConnector.connect({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    database: process.env.DB_NAME || 'retail_store',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || ''
  }).then(res => {
    if (res.success) {
      console.log('[Server] Successfully auto-connected to external DB on startup:', process.env.DB_HOST);
    } else {
      console.warn('[Server] Auto-connect to external DB failed, falling back to sample DB:', res.message);
    }
  }).catch(err => {
    console.warn('[Server] Auto-connect error:', err.message);
  });
}


/**
 * Helper to get currently active database schema
 */
async function getActiveSchema(): Promise<DatabaseSchema> {
  if (MysqlConnector.isConnected()) {
    const mysqlSchema = await MysqlConnector.getSchema();
    if (mysqlSchema) return mysqlSchema;
  }
  return SampleDatabase.getSchema();
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

/**
 * Health check & status
 */
app.get('/api/health', async (req: Request, res: Response) => {
  const isMysql = MysqlConnector.isConnected();
  const hasGeminiKey = GeminiProvider.isApiKeyConfigured();

  res.json({
    status: 'ok',
    aiProvider: {
      name: 'Google Gemini',
      model: 'gemini-3.8-flash',
      freeTier: true,
      isConfigured: hasGeminiKey
    },
    database: {
      activeEngine: isMysql ? 'mysql' : 'builtin-relational',
      activeDatabase: isMysql ? MysqlConnector.getConfig()?.database : 'retail_store',
      isExternalConnected: isMysql
    },
    securityRulesActive: [
      'AST & Token Parser',
      'Read-Only SELECT Enforcement',
      'Forbidden DDL/DML Blocklist',
      'Comment Obfuscation Check',
      'Single Statement Enforcement',
      'Schema Table Validation',
      '5000ms Query Timeout',
      'Row Cap (LIMIT 100/500)'
    ]
  });
});

/**
 * Database Schema Introspection
 */
app.get('/api/schema', async (req: Request, res: Response) => {
  try {
    const schema = await getActiveSchema();
    res.json({ success: true, schema });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Connect to external MySQL database or switch back to built-in sample database
 */
app.post('/api/connect-db', async (req: Request, res: Response) => {
  const { mode, config } = req.body as { mode: 'builtin' | 'mysql'; config?: DatabaseConnectionConfig };

  if (mode === 'builtin') {
    await MysqlConnector.disconnect();
    const schema = SampleDatabase.getSchema();
    return res.json({
      success: true,
      message: 'Switched to built-in sample relational database (retail_store).',
      schema
    });
  }

  if (mode === 'mysql') {
    if (!config || !config.host || !config.database || !config.user) {
      return res.status(400).json({
        success: false,
        message: 'Host, Database name, and Username are required for MySQL connection.'
      });
    }

    const connectResult = await MysqlConnector.connect(config);
    if (!connectResult.success) {
      return res.status(400).json(connectResult);
    }

    return res.json(connectResult);
  }

  res.status(400).json({ success: false, message: 'Invalid connection mode' });
});

/**
 * AI SQL Generation
 */
app.post('/api/generate-sql', async (req: Request, res: Response) => {
  const { question, conversationHistory } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ success: false, error: 'Question is required.' });
  }

  try {
    const schema = await getActiveSchema();
    const queryPlan = await GeminiProvider.generateSqlQuery(question.trim(), schema, conversationHistory);
    
    // Automatically pre-validate the generated query
    const validation = SqlValidator.validate(queryPlan.sql, schema);

    res.json({
      success: true,
      queryPlan: {
        ...queryPlan,
        sql: validation.sanitizedSql // Use sanitized version
      },
      validation
    });
  } catch (err: any) {
    console.error('[API /generate-sql] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate SQL' });
  }
});

/**
 * SQL Security Validation
 */
app.post('/api/validate-sql', async (req: Request, res: Response) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ success: false, error: 'SQL query string is required' });
  }

  try {
    const schema = await getActiveSchema();
    const validation = SqlValidator.validate(sql, schema);
    res.json({ success: true, validation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Execute validated query on active database
 */
app.post('/api/execute-sql', async (req: Request, res: Response) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ success: false, error: 'SQL query is required' });
  }

  try {
    const schema = await getActiveSchema();
    
    // 1. Mandatory Security Validation check before execution
    const validation = SqlValidator.validate(sql, schema);
    if (!validation.isValid) {
      return res.status(403).json({
        success: false,
        error: `SQL validation failed: ${validation.errors.join('; ')}`,
        validation
      });
    }

    const queryToRun = validation.sanitizedSql;

    // 2. Execute on active engine
    let executionResult;
    if (MysqlConnector.isConnected()) {
      executionResult = await MysqlConnector.executeQuery(queryToRun);
    } else {
      executionResult = await SampleDatabase.executeQuery(queryToRun);
    }

    res.json({
      success: executionResult.success,
      result: executionResult,
      validation
    });
  } catch (err: any) {
    console.error('[API /execute-sql] Execution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * AI Query Explanation
 */
app.post('/api/explain-sql', async (req: Request, res: Response) => {
  const { sql, question, rowCount } = req.body;

  if (!sql || !question) {
    return res.status(400).json({ success: false, error: 'SQL and question are required' });
  }

  try {
    const schema = await getActiveSchema();
    const explanation = await GeminiProvider.explainQuery(sql, question, schema, Number(rowCount) || 0);
    res.json({ success: true, explanation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * AI SQL Auto-Correction
 */
app.post('/api/correct-sql', async (req: Request, res: Response) => {
  const { failedSql, errorMessage, question, attemptNumber } = req.body;

  if (!failedSql || !errorMessage) {
    return res.status(400).json({ success: false, error: 'failedSql and errorMessage are required' });
  }

  try {
    const schema = await getActiveSchema();
    const correction = await GeminiProvider.correctSqlQuery(
      failedSql,
      errorMessage,
      question || 'SQL execution failed',
      schema,
      Number(attemptNumber) || 1
    );

    // Validate the corrected query before returning it to the user
    const validation = SqlValidator.validate(correction.correctedSql, schema);

    res.json({
      success: true,
      correction: {
        ...correction,
        correctedSql: validation.sanitizedSql
      },
      validation
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Download / View Sample MySQL DDL & DML Script
 */
app.get('/api/sample-sql-script', (req: Request, res: Response) => {
  const userEmail = (req.headers['x-user-email'] as string || '').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'preetesh4153@gmail.com').trim().toLowerCase();
  if (userEmail !== adminEmail) {
    return res.status(403).type('text/plain').send('-- Access restricted: Sample seed script is reserved for workspace administrator.');
  }
  res.type('text/plain').send(SampleDatabase.getSampleSqlScript());
});

// -----------------------------------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC ASSETS
// -----------------------------------------------------------------------------
async function setupVite() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving production build from dist folder.');
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Server] AI Database Agent running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('[Server] Failed to initialize server:', err);
});
