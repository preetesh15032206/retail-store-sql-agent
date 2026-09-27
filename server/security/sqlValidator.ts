import { DatabaseSchema, ValidationResult, ValidationRuleCheck } from '../../shared/types.js';

/**
 * Multi-layer Security SQL Validator
 * Ensures only safe, read-only SELECT queries are executed.
 */

// Forbidden commands that modify data, structure, permissions, or system state
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE',
  'GRANT', 'REVOKE', 'RENAME', 'REPLACE', 'CALL', 'EXEC', 'EXECUTE',
  'LOAD DATA', 'INTO OUTFILE', 'INTO DUMPFILE', 'LOAD_FILE', 'PREPARE',
  'DEALLOCATE', 'SHUTDOWN', 'KILL', 'FLUSH', 'RESET', 'LOCK', 'UNLOCK',
  'HANDLER', 'ADMIN', 'SOURCE'
];

// Dangerous functions often used in timing attacks or DoS
const DANGEROUS_FUNCTIONS = [
  'SLEEP', 'BENCHMARK', 'GET_LOCK', 'RELEASE_LOCK', 'SYSTEM_USER', 'SESSION_USER'
];

export class SqlValidator {
  /**
   * Cleans quotes and extracts non-literal tokens to prevent bypasses inside string literals
   */
  private static stripStringLiterals(sql: string): string {
    // Replace single-quoted strings with empty quotes
    let stripped = sql.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    // Replace double-quoted strings
    stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    // Replace backtick quoted identifiers with placeholder
    stripped = stripped.replace(/`([^`]+)`/g, '$1');
    return stripped;
  }

  /**
   * Validates SQL against all security rules
   */
  public static validate(sql: string, schema?: DatabaseSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const ruleChecks: ValidationRuleCheck[] = [];

    const rawSql = (sql || '').trim();
    if (!rawSql) {
      return {
        isValid: false,
        isReadOnly: false,
        sanitizedSql: '',
        errors: ['SQL query is empty.'],
        warnings: [],
        ruleChecks: [{ id: 'non_empty', name: 'Non-empty Query', passed: false, details: 'Query is empty' }],
        tablesDetected: [],
        columnsDetected: [],
        hasLimit: false
      };
    }

    // Rule 1: No SQL comments (potential obfuscation / injection bypass)
    const hasSingleLineComment = /(--|#)/.test(rawSql);
    const hasBlockComment = /\/\*[\s\S]*?\*\//.test(rawSql);
    const commentsCheck = !hasSingleLineComment && !hasBlockComment;
    ruleChecks.push({
      id: 'no_comments',
      name: 'Comment Obfuscation Check',
      passed: commentsCheck,
      details: commentsCheck ? 'No comment tags detected' : 'Detected disallowed SQL comment characters (-- or /* */ or #)'
    });
    if (!commentsCheck) {
      errors.push('SQL comments (-- or /* */ or #) are not allowed to avoid syntax obfuscation.');
    }

    const stripped = this.stripStringLiterals(rawSql);

    // Rule 2: Single statement check (no multi-query semicolons)
    const statements = stripped.split(';').map(s => s.trim()).filter(s => s.length > 0);
    const singleStatementCheck = statements.length <= 1;
    ruleChecks.push({
      id: 'single_statement',
      name: 'Single Statement Enforcement',
      passed: singleStatementCheck,
      details: singleStatementCheck ? 'Only one statement present' : `Multiple queries detected (${statements.length} statements separated by semicolons)`
    });
    if (!singleStatementCheck) {
      errors.push('Multiple statements separated by semicolons are strictly prohibited.');
    }

    // Rule 3: Must start with SELECT or WITH (for CTEs)
    const cleanedSql = rawSql.replace(/;+$/, '').trim();
    const startsWithSelectOrWith = /^(SELECT|WITH)\b/i.test(cleanedSql);
    ruleChecks.push({
      id: 'select_only',
      name: 'Read-Only SELECT Enforcement',
      passed: startsWithSelectOrWith,
      details: startsWithSelectOrWith ? 'Starts with allowed SELECT/WITH statement' : 'Query must start with SELECT or WITH'
    });
    if (!startsWithSelectOrWith) {
      errors.push('Query must be a read-only SELECT or WITH statement.');
    }

    // Rule 4: Forbidden keywords check
    const uppercaseStripped = stripped.toUpperCase();
    const detectedForbidden: string[] = [];
    for (const kw of FORBIDDEN_KEYWORDS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(stripped)) {
        detectedForbidden.push(kw);
      }
    }
    const forbiddenCheck = detectedForbidden.length === 0;
    ruleChecks.push({
      id: 'forbidden_keywords',
      name: 'Destructive DDL/DML Blocklist',
      passed: forbiddenCheck,
      details: forbiddenCheck ? 'No mutating or administrative keywords' : `Found prohibited command(s): ${detectedForbidden.join(', ')}`
    });
    if (!forbiddenCheck) {
      errors.push(`Prohibited operations detected: ${detectedForbidden.join(', ')}`);
    }

    // Rule 5: Dangerous functions check (timing attacks)
    const detectedDangerousFuncs: string[] = [];
    for (const fn of DANGEROUS_FUNCTIONS) {
      const regex = new RegExp(`\\b${fn}\\s*\\(`, 'i');
      if (regex.test(stripped)) {
        detectedDangerousFuncs.push(fn);
      }
    }
    const funcCheck = detectedDangerousFuncs.length === 0;
    ruleChecks.push({
      id: 'safe_functions',
      name: 'Denial of Service / Sleep Prevention',
      passed: funcCheck,
      details: funcCheck ? 'No high-risk timing functions' : `Blocked function(s): ${detectedDangerousFuncs.join(', ')}`
    });
    if (!funcCheck) {
      errors.push(`Disallowed function call detected: ${detectedDangerousFuncs.join(', ')}`);
    }

    // Extract table names
    const tablesDetected = this.extractTableNames(rawSql);

    // Rule 6: Schema table validation (if schema provided)
    if (schema && schema.tables && schema.tables.length > 0) {
      const knownTableNames = schema.tables.map(t => t.name.toLowerCase());
      const unknownTables = tablesDetected.filter(t => !knownTableNames.includes(t.toLowerCase()));
      const tableCheck = unknownTables.length === 0;

      ruleChecks.push({
        id: 'schema_tables',
        name: 'Schema Table Validation',
        passed: tableCheck,
        details: tableCheck
          ? `Verified tables: ${tablesDetected.join(', ') || 'None'}`
          : `Unknown table(s) not in active database schema: ${unknownTables.join(', ')}`
      });

      if (!tableCheck) {
        errors.push(`Referenced table(s) do not exist in the database schema: ${unknownTables.join(', ')}`);
      }
    }

    // Rule 7: Result Size Limit Handling
    const hasLimit = /\bLIMIT\s+\d+/i.test(rawSql);
    let sanitizedSql = cleanedSql;
    let injectedLimit: number | undefined = undefined;

    if (!hasLimit) {
      // Automatically enforce safe maximum limit of 100
      sanitizedSql = `${cleanedSql} LIMIT 100`;
      injectedLimit = 100;
      warnings.push('No LIMIT clause was specified. Automatically appended LIMIT 100 to prevent runaway memory usage.');
      ruleChecks.push({
        id: 'result_limit',
        name: 'Result Size Limit Check',
        passed: true,
        details: 'Automatically added safety LIMIT 100'
      });
    } else {
      // Check if limit is within safe maximum (500)
      const limitMatch = rawSql.match(/\bLIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limitVal = parseInt(limitMatch[1], 10);
        if (limitVal > 500) {
          sanitizedSql = rawSql.replace(/\bLIMIT\s+\d+/i, 'LIMIT 500');
          injectedLimit = 500;
          warnings.push(`Specified LIMIT ${limitVal} exceeded maximum threshold. Capped to LIMIT 500.`);
          ruleChecks.push({
            id: 'result_limit',
            name: 'Result Size Limit Check',
            passed: true,
            details: `Adjusted excessive limit from ${limitVal} to 500`
          });
        } else {
          ruleChecks.push({
            id: 'result_limit',
            name: 'Result Size Limit Check',
            passed: true,
            details: `Valid limit specified: ${limitVal}`
          });
        }
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      isReadOnly: startsWithSelectOrWith && forbiddenCheck,
      sanitizedSql: isValid ? sanitizedSql : rawSql,
      errors,
      warnings,
      ruleChecks,
      tablesDetected,
      columnsDetected: [],
      hasLimit: hasLimit || injectedLimit !== undefined,
      injectedLimit
    };
  }

  /**
   * Helper to parse table names from FROM and JOIN clauses
   */
  public static extractTableNames(sql: string): string[] {
    const tables = new Set<string>();
    const cleaned = sql.replace(/\s+/g, ' ');

    // FROM table_name [AS alias]
    const fromRegex = /\bFROM\s+([`"]?[a-zA-Z0-9_]+[`"]?)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/gi;
    let match;
    while ((match = fromRegex.exec(cleaned)) !== null) {
      if (match[1] && !match[1].startsWith('(')) {
        tables.add(match[1].replace(/[`"]/g, ''));
      }
    }

    // JOIN table_name [AS alias]
    const joinRegex = /\b(?:LEFT|RIGHT|INNER|FULL|CROSS)?\s*JOIN\s+([`"]?[a-zA-Z0-9_]+[`"]?)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/gi;
    while ((match = joinRegex.exec(cleaned)) !== null) {
      if (match[1] && !match[1].startsWith('(')) {
        tables.add(match[1].replace(/[`"]/g, ''));
      }
    }

    return Array.from(tables);
  }
}
