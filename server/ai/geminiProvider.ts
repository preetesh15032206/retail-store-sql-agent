import { GoogleGenAI, Type } from '@google/genai';
import { DatabaseSchema, QueryPlan, QueryExplanation } from '../../shared/types.js';

/**
 * AI Provider for SQL Generation, Explanation, and Error Auto-Correction
 * Uses the free-tier Gemini 3.8 Flash model via the official @google/genai SDK.
 */

export class GeminiProvider {
  private static aiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }

    return this.aiClient;
  }

  public static isApiKeyConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5;
  }

  /**
   * Formats the schema concisely for the LLM prompt to minimize token consumption
   */
  private static formatSchemaPrompt(schema: DatabaseSchema): string {
    let schemaStr = `DATABASE ENGINE: ${schema.engine.toUpperCase()}\nDATABASE NAME: ${schema.databaseName}\n\nTABLES AND COLUMNS:\n`;
    for (const table of schema.tables) {
      schemaStr += `Table: ${table.name} (${table.description || 'No description'})\n`;
      schemaStr += `Columns:\n`;
      for (const col of table.columns) {
        let colMeta = `  - ${col.name} (${col.type})`;
        if (col.isPrimaryKey) colMeta += ' [PRIMARY KEY]';
        if (col.isForeignKey && col.foreignKeyRef) {
          colMeta += ` [FOREIGN KEY -> ${col.foreignKeyRef.table}.${col.foreignKeyRef.column}]`;
        }
        if (col.description) colMeta += ` // ${col.description}`;
        schemaStr += `${colMeta}\n`;
      }
      schemaStr += '\n';
    }

    if (schema.relationshipsDescription) {
      schemaStr += `\nRELATIONSHIPS:\n${schema.relationshipsDescription}\n`;
    }

    return schemaStr;
  }

  /**
   * Generates a safe SQL query plan from natural language
   */
  public static async generateSqlQuery(
    userQuestion: string,
    schema: DatabaseSchema,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>
  ): Promise<QueryPlan> {
    const ai = this.getClient();

    if (!ai) {
      console.warn('[AI Provider] No GEMINI_API_KEY configured. Falling back to deterministic SQL planner.');
      return this.fallbackQueryPlanner(userQuestion, schema);
    }

    const schemaPrompt = this.formatSchemaPrompt(schema);

    let historyContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = '\nRECENT CONVERSATION HISTORY (FOR CONTEXT & FOLLOW-UP RESOLUTION):\n';
      for (const h of conversationHistory.slice(-4)) {
        historyContext += `${h.role.toUpperCase()}: ${h.text}\n`;
      }
    }

    const systemInstruction = `
You are a senior principal database architect and SQL security engineer.
Your job is to translate user natural language questions into safe, optimized, read-only MySQL SQL queries.

CRITICAL RULES:
1. ONLY generate safe SELECT queries (or WITH ... SELECT). NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any mutating statements.
2. STRICT SCHEMA CONFORMANCE: Use ONLY tables and columns that exist in the provided schema. NEVER hallucinate table or column names.
3. Correct JOIN logic: Use appropriate INNER or LEFT JOINs based on the foreign key relationships provided.
4. Correct Aggregation & Grouping: When using aggregate functions (SUM, AVG, COUNT, MIN, MAX), ensure all non-aggregated SELECT columns are present in GROUP BY.
5. Provide a reasonable LIMIT (default 10 or 20 for rankings; max 100 unless requested).
6. Currency and numbers: When monetary values are referenced, use the price or total_amount column.
7. Return a structured JSON response matching the required schema. No conversational filler.
    `.trim();

    const prompt = `
${schemaPrompt}
${historyContext}
USER QUESTION: "${userQuestion}"

Generate the optimal read-only SQL query and select an appropriate visualization type ('bar', 'line', 'pie', 'donut', 'area', 'scatter', or 'table').
    `.trim();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1, // Low temperature for high accuracy & determinism
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sql: {
                type: Type.STRING,
                description: 'The valid MySQL SELECT query.'
              },
              reasoning_summary: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence explanation of how the query satisfies the user request.'
              },
              tables_used: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of exact table names queried.'
              },
              columns_used: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of column names referenced.'
              },
              visualization_type: {
                type: Type.STRING,
                description: 'Best chart type: bar, line, pie, donut, area, scatter, or table.'
              },
              confidence: {
                type: Type.STRING,
                description: 'high, medium, or low confidence.'
              }
            },
            required: ['sql', 'reasoning_summary', 'tables_used', 'columns_used', 'visualization_type', 'confidence']
          }
        }
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      // Sanitize SQL
      let cleanSql = (parsed.sql || '').trim().replace(/;+$/, '');
      if (!cleanSql) {
        throw new Error('AI returned empty SQL string');
      }

      return {
        sql: cleanSql,
        reasoning_summary: parsed.reasoning_summary || 'Generated SQL based on database schema.',
        tables_used: parsed.tables_used || [],
        columns_used: parsed.columns_used || [],
        visualization_type: (['bar', 'line', 'pie', 'donut', 'area', 'scatter', 'table'].includes(parsed.visualization_type)
          ? parsed.visualization_type
          : 'bar') as any,
        confidence: parsed.confidence || 'high'
      };
    } catch (err: any) {
      console.error('[AI Provider] Gemini generation error:', err.message);
      // Fallback gracefully so user query does not completely crash
      return this.fallbackQueryPlanner(userQuestion, schema);
    }
  }

  /**
   * Explains an executed SQL query in beginner-friendly, structured terms
   */
  public static async explainQuery(
    sql: string,
    question: string,
    schema: DatabaseSchema,
    rowCount: number
  ): Promise<QueryExplanation> {
    const ai = this.getClient();
    if (!ai) {
      return this.fallbackExplainer(sql, question, rowCount);
    }

    const prompt = `
DATABASE SCHEMA:
${this.formatSchemaPrompt(schema)}

USER QUESTION: "${question}"
EXECUTED SQL:
\`\`\`sql
${sql}
\`\`\`
RESULT ROW COUNT: ${rowCount}

Explain this query and its results in a clear, beginner-friendly way. Break down the tables, joins, filters, aggregations, and business meaning.
    `.trim();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an approachable data engineering instructor explaining SQL queries clearly.',
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              userIntent: { type: Type.STRING },
              tablesUsed: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    table: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                  },
                  required: ['table', 'purpose']
                }
              },
              joinsApplied: { type: Type.ARRAY, items: { type: Type.STRING } },
              filtersApplied: { type: Type.ARRAY, items: { type: Type.STRING } },
              aggregations: { type: Type.ARRAY, items: { type: Type.STRING } },
              groupingAndSorting: { type: Type.ARRAY, items: { type: Type.STRING } },
              businessInsight: { type: Type.STRING },
              plainEnglishSummary: { type: Type.STRING }
            },
            required: [
              'userIntent',
              'tablesUsed',
              'joinsApplied',
              'filtersApplied',
              'aggregations',
              'groupingAndSorting',
              'businessInsight',
              'plainEnglishSummary'
            ]
          }
        }
      });

      return JSON.parse(response.text?.trim() || '{}');
    } catch (err: any) {
      console.warn('[AI Provider] Explainer fallback due to:', err.message);
      return this.fallbackExplainer(sql, question, rowCount);
    }
  }

  /**
   * Corrects a failed SQL query using database error context
   */
  public static async correctSqlQuery(
    failedSql: string,
    errorMessage: string,
    question: string,
    schema: DatabaseSchema,
    attemptNumber: number
  ): Promise<{ correctedSql: string; explanation: string; changes: string }> {
    const ai = this.getClient();

    if (!ai) {
      return {
        correctedSql: failedSql,
        explanation: 'Automatic correction requires GEMINI_API_KEY to be configured.',
        changes: 'No changes made.'
      };
    }

    const prompt = `
DATABASE SCHEMA:
${this.formatSchemaPrompt(schema)}

ORIGINAL USER QUESTION: "${question}"
FAILED SQL QUERY:
\`\`\`sql
${failedSql}
\`\`\`

DATABASE ERROR MESSAGE:
"${errorMessage}"

CORRECTION ATTEMPT: #${attemptNumber} of 2.

Analyze the database error message and the schema carefully. Fix the syntax, table/column name discrepancies, join conditions, or aggregation/GROUP BY issues.
Return only valid, read-only SELECT SQL.
    `.trim();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert SQL debugger. Correct the failed SQL query precisely without introducing new errors.',
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedSql: { type: Type.STRING },
              explanation: { type: Type.STRING },
              changes: { type: Type.STRING }
            },
            required: ['correctedSql', 'explanation', 'changes']
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        correctedSql: (parsed.correctedSql || '').trim().replace(/;+$/, ''),
        explanation: parsed.explanation || 'Fixed SQL syntax according to error feedback.',
        changes: parsed.changes || 'Updated SQL query.'
      };
    } catch (err: any) {
      console.error('[AI Provider] Error during SQL auto-correction:', err.message);
      return {
        correctedSql: failedSql,
        explanation: `Failed to auto-correct query: ${err.message}`,
        changes: 'None'
      };
    }
  }

  /**
   * High-accuracy deterministic fallback planner for offline/demo/keyless mode
   */
  private static fallbackQueryPlanner(question: string, schema: DatabaseSchema): QueryPlan {
    const q = question.toLowerCase();

    // 1. Top customers by spending
    if (q.includes('top') && (q.includes('customer') || q.includes('spending') || q.includes('purchase'))) {
      const limitMatch = q.match(/\b(?:top|first)\s+(\d+)/);
      const limit = limitMatch ? limitMatch[1] : '5';
      return {
        sql: `SELECT c.customer_id, c.name, c.city, SUM(o.total_amount) AS total_spent, COUNT(o.order_id) AS total_orders FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name, c.city ORDER BY total_spent DESC LIMIT ${limit}`,
        reasoning_summary: `Aggregated total order spending grouped by customer and ordered in descending order with LIMIT ${limit}.`,
        tables_used: ['customers', 'orders'],
        columns_used: ['customer_id', 'name', 'city', 'total_amount', 'order_id'],
        visualization_type: 'bar',
        confidence: 'high'
      };
    }

    // 2. Sales / Customers by City
    if (q.includes('city') || q.includes('pune') || q.includes('mumbai') || q.includes('bengaluru')) {
      if (q.includes('sales') || q.includes('revenue') || q.includes('spent')) {
        const thresholdMatch = q.match(/(?:above|greater than|more than)\s*(?:[₹rs\.]*\s*)?(\d+[\d,]*)/i);
        const threshold = thresholdMatch ? thresholdMatch[1].replace(/,/g, '') : null;
        let sql = `SELECT c.city, SUM(o.total_amount) AS total_revenue, COUNT(o.order_id) AS total_orders FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.city`;
        if (threshold) {
          sql += ` HAVING total_revenue > ${threshold}`;
        }
        sql += ` ORDER BY total_revenue DESC LIMIT 10`;

        return {
          sql,
          reasoning_summary: `Calculated total sales revenue grouped by customer city${threshold ? ` filtered for revenue > ₹${threshold}` : ''}.`,
          tables_used: ['customers', 'orders'],
          columns_used: ['city', 'total_amount', 'order_id'],
          visualization_type: 'bar',
          confidence: 'high'
        };
      } else {
        const cityFilter = q.includes('pune') ? " WHERE city = 'Pune'" : (q.includes('mumbai') ? " WHERE city = 'Mumbai'" : '');
        return {
          sql: `SELECT customer_id, name, email, city, state, signup_date FROM customers${cityFilter} ORDER BY signup_date DESC LIMIT 20`,
          reasoning_summary: `Retrieved registered customers${cityFilter ? ` located in ${cityFilter.replace(" WHERE city = '", "").replace("'", "")}` : ''}.`,
          tables_used: ['customers'],
          columns_used: ['customer_id', 'name', 'email', 'city', 'state', 'signup_date'],
          visualization_type: 'table',
          confidence: 'high'
        };
      }
    }

    // 3. Products never ordered
    if (q.includes('never') || q.includes('zero order') || q.includes('not ordered') || q.includes('unpopular')) {
      return {
        sql: `SELECT p.product_id, p.name, p.category, p.price, p.stock_quantity FROM products p LEFT JOIN orders o ON p.product_id = o.product_id WHERE o.order_id IS NULL ORDER BY p.price DESC LIMIT 20`,
        reasoning_summary: `Performed a LEFT JOIN from products to orders filtering where order_id IS NULL to identify products never purchased.`,
        tables_used: ['products', 'orders'],
        columns_used: ['product_id', 'name', 'category', 'price', 'stock_quantity', 'order_id'],
        visualization_type: 'table',
        confidence: 'high'
      };
    }

    // 4. Revenue by category / product revenue
    if (q.includes('category') || (q.includes('product') && (q.includes('revenue') || q.includes('sales')))) {
      if (q.includes('category')) {
        return {
          sql: `SELECT p.category, SUM(o.total_amount) AS total_revenue, SUM(o.quantity) AS units_sold FROM products p JOIN orders o ON p.product_id = o.product_id GROUP BY p.category ORDER BY total_revenue DESC LIMIT 10`,
          reasoning_summary: `Calculated cumulative sales revenue and units sold grouped by product category.`,
          tables_used: ['products', 'orders'],
          columns_used: ['category', 'total_amount', 'quantity'],
          visualization_type: 'donut',
          confidence: 'high'
        };
      } else {
        return {
          sql: `SELECT p.product_id, p.name, p.category, SUM(o.total_amount) AS total_revenue, SUM(o.quantity) AS units_sold FROM products p JOIN orders o ON p.product_id = o.product_id GROUP BY p.product_id, p.name, p.category ORDER BY total_revenue DESC LIMIT 10`,
          reasoning_summary: `Joined products with orders to aggregate revenue and units sold per product, ordered by revenue descending.`,
          tables_used: ['products', 'orders'],
          columns_used: ['product_id', 'name', 'category', 'total_amount', 'quantity'],
          visualization_type: 'bar',
          confidence: 'high'
        };
      }
    }

    // 5. Monthly revenue / Date trends
    if (q.includes('month') || q.includes('trend') || q.includes('date') || q.includes('timeline')) {
      return {
        sql: `SELECT SUBSTRING(order_date, 1, 7) AS month, SUM(total_amount) AS monthly_revenue, COUNT(order_id) AS order_count FROM orders GROUP BY SUBSTRING(order_date, 1, 7) ORDER BY month ASC LIMIT 20`,
        reasoning_summary: `Grouped sales orders by calendar month (YYYY-MM) and aggregated total revenue and order volume.`,
        tables_used: ['orders'],
        columns_used: ['order_date', 'total_amount', 'order_id'],
        visualization_type: 'line',
        confidence: 'high'
      };
    }

    // 6. Average order value (AOV)
    if (q.includes('average order') || q.includes('aov') || q.includes('avg order')) {
      return {
        sql: `SELECT COUNT(order_id) AS total_orders, ROUND(SUM(total_amount), 2) AS total_sales, ROUND(AVG(total_amount), 2) AS average_order_value FROM orders LIMIT 1`,
        reasoning_summary: `Calculated aggregate order statistics including total count, total revenue, and average order value.`,
        tables_used: ['orders'],
        columns_used: ['order_id', 'total_amount'],
        visualization_type: 'table',
        confidence: 'high'
      };
    }

    // 7. Customers spending over ₹50,000
    if (q.includes('50000') || q.includes('50,000') || (q.includes('spent') && q.includes('more than'))) {
      const match = q.match(/\d+[\d,]*/);
      const amount = match ? match[0].replace(/,/g, '') : '50000';
      return {
        sql: `SELECT c.customer_id, c.name, c.city, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name, c.city HAVING total_spent > ${amount} ORDER BY total_spent DESC LIMIT 20`,
        reasoning_summary: `Filtered customers with total cumulative order purchases exceeding ₹${amount}.`,
        tables_used: ['customers', 'orders'],
        columns_used: ['customer_id', 'name', 'city', 'total_amount'],
        visualization_type: 'bar',
        confidence: 'high'
      };
    }

    // Default: Show recent records from primary table
    const firstTable = schema.tables[0]?.name || 'customers';
    return {
      sql: `SELECT * FROM ${firstTable} LIMIT 25`,
      reasoning_summary: `Retrieved sample rows from table '${firstTable}'.`,
      tables_used: [firstTable],
      columns_used: ['*'],
      visualization_type: 'table',
      confidence: 'medium'
    };
  }

  private static fallbackExplainer(sql: string, question: string, rowCount: number): QueryExplanation {
    return {
      userIntent: `The user asked: "${question}"`,
      tablesUsed: [
        { table: 'Target database tables', purpose: 'Provide source records for filtering and aggregation.' }
      ],
      joinsApplied: sql.toUpperCase().includes('JOIN') ? ['Relational JOIN between tables on primary and foreign keys.'] : ['Single table query; no joins required.'],
      filtersApplied: sql.toUpperCase().includes('WHERE') ? ['Filter conditions applied via WHERE clause.'] : ['No row-level filtering applied.'],
      aggregations: sql.toUpperCase().includes('SUM') || sql.toUpperCase().includes('COUNT') || sql.toUpperCase().includes('AVG')
        ? ['Aggregated metrics computed (e.g. SUM, COUNT, or AVG).']
        : ['Direct row retrieval without grouping aggregates.'],
      groupingAndSorting: sql.toUpperCase().includes('ORDER BY')
        ? ['Results sorted to highlight top records.']
        : ['Default table ordering.'],
      businessInsight: `Successfully processed query returning ${rowCount} record(s).`,
      plainEnglishSummary: `This query answered "${question}" by pulling records and structuring the data for immediate visual inspection.`
    };
  }
}
