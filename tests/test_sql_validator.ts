import { SqlValidator } from '../server/security/sqlValidator.js';
import { SampleDatabase } from '../server/database/sampleDatabase.js';

console.log('====================================================');
console.log('🧪 RUNNING AI DATABASE AGENT SECURITY & TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// 1. Initialize Sample Database and Schema
SampleDatabase.initialize();
const schema = SampleDatabase.getSchema();

console.log('--- TEST GROUP 1: SQL VALIDATOR SECURITY ENFORCEMENT ---');

// Test 1.1: Safe SELECT
const safeSelect = SqlValidator.validate('SELECT * FROM customers WHERE city = "Pune"', schema);
assert(safeSelect.isValid, 'Standard SELECT statement is permitted');
assert(safeSelect.isReadOnly, 'Standard SELECT is flagged as read-only');

// Test 1.2: DROP table
const dropTest = SqlValidator.validate('DROP TABLE customers', schema);
assert(!dropTest.isValid, 'DROP TABLE is blocked');

// Test 1.3: DELETE rows
const deleteTest = SqlValidator.validate('DELETE FROM customers WHERE customer_id = 1', schema);
assert(!deleteTest.isValid, 'DELETE FROM is blocked');

// Test 1.4: UPDATE rows
const updateTest = SqlValidator.validate('UPDATE customers SET name = "Hacker" WHERE customer_id = 1', schema);
assert(!updateTest.isValid, 'UPDATE is blocked');

// Test 1.5: INSERT rows
const insertTest = SqlValidator.validate('INSERT INTO customers VALUES (999, "Test", "t@test.com", "Pune", "MH", "2024-01-01")', schema);
assert(!insertTest.isValid, 'INSERT INTO is blocked');

// Test 1.6: ALTER table
const alterTest = SqlValidator.validate('ALTER TABLE customers ADD COLUMN balance INT', schema);
assert(!alterTest.isValid, 'ALTER TABLE is blocked');

// Test 1.7: TRUNCATE table
const truncateTest = SqlValidator.validate('TRUNCATE TABLE customers', schema);
assert(!truncateTest.isValid, 'TRUNCATE TABLE is blocked');

// Test 1.8: Multiple statements (semicolon chained execution)
const multiTest = SqlValidator.validate('SELECT * FROM customers; DROP TABLE orders;', schema);
assert(!multiTest.isValid, 'Chained multi-query statements are blocked');

// Test 1.9: Comment-based bypass attempts (-- or /* */ or #)
const commentTest1 = SqlValidator.validate('SELECT * FROM customers -- ignore rest', schema);
assert(!commentTest1.isValid, 'Single-line comment (--) is blocked');

const commentTest2 = SqlValidator.validate('SELECT * FROM customers /* comment */ WHERE 1=1', schema);
assert(!commentTest2.isValid, 'Block comment (/* */) is blocked');

const commentTest3 = SqlValidator.validate('SELECT * FROM customers # comment', schema);
assert(!commentTest3.isValid, 'Hash comment (#) is blocked');

// Test 1.10: Timing attacks / Sleep
const sleepTest = SqlValidator.validate('SELECT SLEEP(10) FROM customers', schema);
assert(!sleepTest.isValid, 'SLEEP() denial-of-service attempt is blocked');

// Test 1.11: Hallucinated / Non-existent tables
const unknownTableTest = SqlValidator.validate('SELECT * FROM secret_payroll_passwords', schema);
assert(!unknownTableTest.isValid, 'Unknown/hallucinated table not in schema is blocked');

// Test 1.12: Automatic LIMIT injection
const noLimitTest = SqlValidator.validate('SELECT * FROM customers', schema);
assert(noLimitTest.isValid, 'SELECT without limit is allowed');
assert(noLimitTest.sanitizedSql.includes('LIMIT 100'), 'Automatically appends LIMIT 100');

// Test 1.13: Capping excessive LIMIT
const excessiveLimitTest = SqlValidator.validate('SELECT * FROM customers LIMIT 5000', schema);
assert(excessiveLimitTest.isValid, 'Query with excessive limit is sanitized');
assert(excessiveLimitTest.sanitizedSql.includes('LIMIT 500'), 'Excessive limit capped to LIMIT 500');

console.log('\n--- TEST GROUP 2: IN-MEMORY RELATIONAL DATABASE EXECUTION ---');

async function testDatabase() {
  // Test 2.1: Join and aggregation
  const joinQuery = 'SELECT c.city, SUM(o.total_amount) AS total_revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.city ORDER BY total_revenue DESC LIMIT 5';
  const result = await SampleDatabase.executeQuery(joinQuery);

  assert(result.success, 'Relational JOIN and aggregation query executes successfully');
  assert(result.rowCount > 0, `Returned ${result.rowCount} rows`);
  assert(result.columns.includes('city') && result.columns.includes('total_revenue'), 'Columns match projection');

  // Test 2.2: Outer Join (products never ordered)
  const outerJoinQuery = 'SELECT p.name, p.price FROM products p LEFT JOIN orders o ON p.product_id = o.product_id WHERE o.order_id IS NULL';
  const outerResult = await SampleDatabase.executeQuery(outerJoinQuery);

  assert(outerResult.success, 'Outer LEFT JOIN for unordered products executes successfully');
  assert(outerResult.rowCount === 2, `Correctly identified 2 unordered products (got ${outerResult.rowCount})`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

testDatabase().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
