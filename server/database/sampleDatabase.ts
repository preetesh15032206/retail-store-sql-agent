import alasql from 'alasql';
import { DatabaseSchema, ExecutionResult, QueryResultAnalysis } from '../../shared/types.js';

/**
 * Built-in Sample Relational Database (E-Commerce Store)
 * Supports zero-setup, instant execution of standard SQL queries.
 */

export class SampleDatabase {
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;

    try {
      // Create Database in alasql
      alasql('CREATE DATABASE IF NOT EXISTS retail_store');
      alasql('USE retail_store');

      // Create customers table
      alasql(`
        CREATE TABLE IF NOT EXISTS customers (
          customer_id INT PRIMARY KEY,
          name STRING,
          email STRING,
          city STRING,
          state STRING,
          signup_date STRING
        )
      `);

      // Create products table
      alasql(`
        CREATE TABLE IF NOT EXISTS products (
          product_id INT PRIMARY KEY,
          name STRING,
          category STRING,
          price FLOAT,
          stock_quantity INT
        )
      `);

      // Create orders table
      alasql(`
        CREATE TABLE IF NOT EXISTS orders (
          order_id INT PRIMARY KEY,
          customer_id INT,
          product_id INT,
          quantity INT,
          total_amount FLOAT,
          order_date STRING,
          status STRING
        )
      `);

      // Reset and Seed Customers
      alasql('DELETE FROM customers');
      const customers = [
        { customer_id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@example.in', city: 'Pune', state: 'Maharashtra', signup_date: '2023-01-15' },
        { customer_id: 2, name: 'Diya Patel', email: 'diya.patel@example.in', city: 'Mumbai', state: 'Maharashtra', signup_date: '2023-02-10' },
        { customer_id: 3, name: 'Rohan Gupta', email: 'rohan.gupta@example.in', city: 'Bengaluru', state: 'Karnataka', signup_date: '2023-03-05' },
        { customer_id: 4, name: 'Ananya Iyer', email: 'ananya.iyer@example.in', city: 'Chennai', state: 'Tamil Nadu', signup_date: '2023-03-22' },
        { customer_id: 5, name: 'Kabir Verma', email: 'kabir.verma@example.in', city: 'Delhi', state: 'Delhi', signup_date: '2023-04-12' },
        { customer_id: 6, name: 'Pooja Nair', email: 'pooja.nair@example.in', city: 'Pune', state: 'Maharashtra', signup_date: '2023-05-01' },
        { customer_id: 7, name: 'Vikram Singh', email: 'vikram.singh@example.in', city: 'Hyderabad', state: 'Telangana', signup_date: '2023-06-18' },
        { customer_id: 8, name: 'Neha Joshi', email: 'neha.joshi@example.in', city: 'Pune', state: 'Maharashtra', signup_date: '2023-07-04' },
        { customer_id: 9, name: 'Siddharth Rao', email: 'siddharth.rao@example.in', city: 'Bengaluru', state: 'Karnataka', signup_date: '2023-08-11' },
        { customer_id: 10, name: 'Meera Kulkarni', email: 'meera.k@example.in', city: 'Mumbai', state: 'Maharashtra', signup_date: '2023-09-09' },
        { customer_id: 11, name: 'Arjun Das', email: 'arjun.das@example.in', city: 'Kolkata', state: 'West Bengal', signup_date: '2023-10-14' },
        { customer_id: 12, name: 'Sneha Reddy', email: 'sneha.reddy@example.in', city: 'Hyderabad', state: 'Telangana', signup_date: '2023-11-20' },
      ];
      for (const c of customers) {
        alasql('INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?)', [
          c.customer_id, c.name, c.email, c.city, c.state, c.signup_date
        ]);
      }

      // Reset and Seed Products (including some with zero orders)
      alasql('DELETE FROM products');
      const products = [
        { product_id: 101, name: 'Ultra HD 4K Smart TV', category: 'Electronics', price: 42999.00, stock_quantity: 25 },
        { product_id: 102, name: 'Noise-Cancelling Headphones', category: 'Electronics', price: 14999.00, stock_quantity: 80 },
        { product_id: 103, name: 'Ergonomic Mesh Chair', category: 'Furniture', price: 12499.00, stock_quantity: 45 },
        { product_id: 104, name: 'Solid Wood Study Desk', category: 'Furniture', price: 18999.00, stock_quantity: 20 },
        { product_id: 105, name: 'Wireless Mechanical Keyboard', category: 'Electronics', price: 6499.00, stock_quantity: 110 },
        { product_id: 106, name: 'Stainless Steel Espresso Machine', category: 'Appliances', price: 21999.00, stock_quantity: 30 },
        { product_id: 107, name: 'Air Fryer 4.5L Digital', category: 'Appliances', price: 5999.00, stock_quantity: 65 },
        { product_id: 108, name: 'Pro Running Shoes', category: 'Apparel', price: 4599.00, stock_quantity: 90 },
        { product_id: 109, name: 'Water-Resistant Hiking Backpack', category: 'Apparel', price: 3299.00, stock_quantity: 140 },
        { product_id: 110, name: 'Smart Fitness Band Pro', category: 'Electronics', price: 2999.00, stock_quantity: 200 },
        // Unordered products (to test "products never ordered" query)
        { product_id: 111, name: 'Vintage Analog Turntable', category: 'Electronics', price: 28999.00, stock_quantity: 15 },
        { product_id: 112, name: 'Smart Hydroponic Indoor Garden', category: 'Home', price: 15999.00, stock_quantity: 12 },
      ];
      for (const p of products) {
        alasql('INSERT INTO products VALUES (?, ?, ?, ?, ?)', [
          p.product_id, p.name, p.category, p.price, p.stock_quantity
        ]);
      }

      // Reset and Seed Orders
      alasql('DELETE FROM orders');
      const orders = [
        { order_id: 1001, customer_id: 1, product_id: 101, quantity: 1, total_amount: 42999.00, order_date: '2023-11-01', status: 'Completed' },
        { order_id: 1002, customer_id: 1, product_id: 102, quantity: 1, total_amount: 14999.00, order_date: '2023-11-15', status: 'Completed' },
        { order_id: 1003, customer_id: 2, product_id: 106, quantity: 2, total_amount: 43998.00, order_date: '2023-11-20', status: 'Completed' },
        { order_id: 1004, customer_id: 2, product_id: 103, quantity: 1, total_amount: 12499.00, order_date: '2023-12-05', status: 'Completed' },
        { order_id: 1005, customer_id: 3, product_id: 105, quantity: 2, total_amount: 12998.00, order_date: '2023-12-10', status: 'Completed' },
        { order_id: 1006, customer_id: 3, product_id: 101, quantity: 1, total_amount: 42999.00, order_date: '2024-01-02', status: 'Completed' },
        { order_id: 1007, customer_id: 4, product_id: 108, quantity: 2, total_amount: 9198.00, order_date: '2024-01-12', status: 'Completed' },
        { order_id: 1008, customer_id: 5, product_id: 104, quantity: 1, total_amount: 18999.00, order_date: '2024-01-18', status: 'Completed' },
        { order_id: 1009, customer_id: 5, product_id: 107, quantity: 1, total_amount: 5999.00, order_date: '2024-01-25', status: 'Completed' },
        { order_id: 1010, customer_id: 6, product_id: 102, quantity: 1, total_amount: 14999.00, order_date: '2024-02-01', status: 'Completed' },
        { order_id: 1011, customer_id: 6, product_id: 105, quantity: 1, total_amount: 6499.00, order_date: '2024-02-14', status: 'Completed' },
        { order_id: 1012, customer_id: 7, product_id: 101, quantity: 1, total_amount: 42999.00, order_date: '2024-02-20', status: 'Completed' },
        { order_id: 1013, customer_id: 7, product_id: 106, quantity: 1, total_amount: 21999.00, order_date: '2024-02-28', status: 'Completed' },
        { order_id: 1014, customer_id: 8, product_id: 107, quantity: 2, total_amount: 11998.00, order_date: '2024-03-05', status: 'Completed' },
        { order_id: 1015, customer_id: 8, product_id: 109, quantity: 3, total_amount: 9897.00, order_date: '2024-03-12', status: 'Completed' },
        { order_id: 1016, customer_id: 9, product_id: 103, quantity: 2, total_amount: 24998.00, order_date: '2024-03-15', status: 'Completed' },
        { order_id: 1017, customer_id: 9, product_id: 110, quantity: 4, total_amount: 11996.00, order_date: '2024-03-22', status: 'Completed' },
        { order_id: 1018, customer_id: 10, product_id: 104, quantity: 1, total_amount: 18999.00, order_date: '2024-04-01', status: 'Completed' },
        { order_id: 1019, customer_id: 10, product_id: 106, quantity: 1, total_amount: 21999.00, order_date: '2024-04-10', status: 'Completed' },
        { order_id: 1020, customer_id: 11, product_id: 108, quantity: 1, total_amount: 4599.00, order_date: '2024-04-18', status: 'Completed' },
        { order_id: 1021, customer_id: 12, product_id: 102, quantity: 2, total_amount: 29998.00, order_date: '2024-04-25', status: 'Completed' },
        { order_id: 1022, customer_id: 2, product_id: 101, quantity: 1, total_amount: 42999.00, order_date: '2024-05-02', status: 'Completed' },
        { order_id: 1023, customer_id: 3, product_id: 106, quantity: 1, total_amount: 21999.00, order_date: '2024-05-15', status: 'Completed' },
        { order_id: 1024, customer_id: 5, product_id: 103, quantity: 1, total_amount: 12499.00, order_date: '2024-05-20', status: 'Completed' },
        { order_id: 1025, customer_id: 7, product_id: 104, quantity: 1, total_amount: 18999.00, order_date: '2024-06-01', status: 'Completed' },
      ];

      for (const o of orders) {
        alasql('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)', [
          o.order_id, o.customer_id, o.product_id, o.quantity, o.total_amount, o.order_date, o.status
        ]);
      }

      this.isInitialized = true;
      console.log('[Database] Built-in sample relational database initialized and seeded successfully.');
    } catch (err) {
      console.error('[Database] Failed to initialize sample database:', err);
    }
  }

  public static getSchema(): DatabaseSchema {
    this.initialize();

    return {
      databaseName: 'retail_store',
      engine: 'builtin-relational',
      tables: [
        {
          name: 'customers',
          description: 'Registered retail customers with contact details and location',
          rowCount: 12,
          primaryKeys: ['customer_id'],
          foreignKeys: [],
          columns: [
            { name: 'customer_id', type: 'INT', nullable: false, isPrimaryKey: true, description: 'Unique customer identifier' },
            { name: 'name', type: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, description: 'Customer full name' },
            { name: 'email', type: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, description: 'Customer email address' },
            { name: 'city', type: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Customer city (e.g. Pune, Mumbai, Bengaluru)' },
            { name: 'state', type: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'State location' },
            { name: 'signup_date', type: 'DATE', nullable: false, isPrimaryKey: false, description: 'Date account was created (YYYY-MM-DD)' }
          ]
        },
        {
          name: 'products',
          description: 'Catalog products with categories, unit prices, and inventory stock',
          rowCount: 12,
          primaryKeys: ['product_id'],
          foreignKeys: [],
          columns: [
            { name: 'product_id', type: 'INT', nullable: false, isPrimaryKey: true, description: 'Unique product identifier' },
            { name: 'name', type: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, description: 'Product name' },
            { name: 'category', type: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, description: 'Product category (Electronics, Furniture, Appliances, Apparel, Home)' },
            { name: 'price', type: 'DECIMAL(10,2)', nullable: false, isPrimaryKey: false, description: 'Unit selling price in ₹' },
            { name: 'stock_quantity', type: 'INT', nullable: false, isPrimaryKey: false, description: 'Available warehouse stock count' }
          ]
        },
        {
          name: 'orders',
          description: 'Customer purchase transactions linking customers to products',
          rowCount: 25,
          primaryKeys: ['order_id'],
          foreignKeys: [
            { column: 'customer_id', referencedTable: 'customers', referencedColumn: 'customer_id' },
            { column: 'product_id', referencedTable: 'products', referencedColumn: 'product_id' }
          ],
          columns: [
            { name: 'order_id', type: 'INT', nullable: false, isPrimaryKey: true, description: 'Unique order identifier' },
            {
              name: 'customer_id',
              type: 'INT',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: true,
              foreignKeyRef: { table: 'customers', column: 'customer_id' },
              description: 'Customer who placed the order'
            },
            {
              name: 'product_id',
              type: 'INT',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: true,
              foreignKeyRef: { table: 'products', column: 'product_id' },
              description: 'Product purchased'
            },
            { name: 'quantity', type: 'INT', nullable: false, isPrimaryKey: false, description: 'Item quantity ordered' },
            { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, isPrimaryKey: false, description: 'Total transaction amount in ₹' },
            { name: 'order_date', type: 'DATE', nullable: false, isPrimaryKey: false, description: 'Order placement date (YYYY-MM-DD)' },
            { name: 'status', type: 'VARCHAR(20)', nullable: false, isPrimaryKey: false, description: 'Order status (Completed, Processing, Cancelled)' }
          ]
        }
      ],
      relationshipsDescription: `
RELATIONSHIPS:
1. customers.customer_id (1) ───< (M) orders.customer_id
2. products.product_id (1) ───< (M) orders.product_id
`
    };
  }

  public static async executeQuery(sql: string): Promise<ExecutionResult> {
    this.initialize();
    const startTime = Date.now();

    try {
      alasql('USE retail_store');
      
      // Execute query using alasql
      const result = alasql(sql);
      const executionTimeMs = Date.now() - startTime;

      let rows: Record<string, any>[] = [];
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object') {
        rows = [result];
      }

      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      const analysis = this.analyzeDataset(rows, columns);

      return {
        success: true,
        sql,
        columns,
        rows,
        rowCount: rows.length,
        executionTimeMs,
        analysis,
        database: 'retail_store',
        engine: 'builtin-relational'
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
        error: err.message || 'SQL execution failed in relational database engine',
        database: 'retail_store',
        engine: 'builtin-relational'
      };
    }
  }

  public static analyzeDataset(rows: Record<string, any>[], columns: string[]): QueryResultAnalysis {
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const dateColumns: string[] = [];

    if (rows.length === 0 || columns.length === 0) {
      return {
        rowCount: 0,
        columnCount: columns.length,
        numericColumns: [],
        categoricalColumns: [],
        dateColumns: [],
        suggestedChartType: 'table'
      };
    }

    // Inspect first 10 rows to determine column data types
    const sample = rows.slice(0, 10);
    for (const col of columns) {
      let isNum = true;
      let isDate = true;

      for (const row of sample) {
        const val = row[col];
        if (val === null || val === undefined) continue;

        if (typeof val !== 'number' && isNaN(Number(val))) {
          isNum = false;
        }

        const dateTest = typeof val === 'string' && /^\d{4}-\d{2}(-\d{2})?/.test(val) && !isNaN(Date.parse(val));
        if (!dateTest) {
          isDate = false;
        }
      }

      if (isDate) {
        dateColumns.push(col);
      } else if (isNum) {
        numericColumns.push(col);
      } else {
        categoricalColumns.push(col);
      }
    }

    // Calculate Summary Statistics for numeric columns
    const summaryStats: Record<string, { total?: number; average?: number; min?: number; max?: number }> = {};
    for (const col of numericColumns) {
      // Exclude IDs from summary statistics
      if (/id$/i.test(col)) continue;

      let total = 0;
      let min = Infinity;
      let max = -Infinity;
      let count = 0;

      for (const row of rows) {
        const val = Number(row[col]);
        if (!isNaN(val)) {
          total += val;
          if (val < min) min = val;
          if (val > max) max = val;
          count++;
        }
      }

      if (count > 0) {
        summaryStats[col] = {
          total: Math.round(total * 100) / 100,
          average: Math.round((total / count) * 100) / 100,
          min: min === Infinity ? undefined : Math.round(min * 100) / 100,
          max: max === -Infinity ? undefined : Math.round(max * 100) / 100
        };
      }
    }

    // Determine Suggested Chart Type
    let suggestedChartType: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter' | 'table' = 'table';
    let xColumn: string | undefined;
    let yColumn: string | undefined;

    const nonIdNumerics = numericColumns.filter(c => !/id$/i.test(c));

    if (dateColumns.length >= 1 && nonIdNumerics.length >= 1) {
      suggestedChartType = 'line';
      xColumn = dateColumns[0];
      yColumn = nonIdNumerics[0];
    } else if (categoricalColumns.length >= 1 && nonIdNumerics.length >= 1) {
      xColumn = categoricalColumns[0];
      yColumn = nonIdNumerics[0];
      // If <= 6 categories, pie/donut can be very good, otherwise bar
      if (rows.length <= 6) {
        suggestedChartType = 'donut';
      } else {
        suggestedChartType = 'bar';
      }
    } else if (nonIdNumerics.length >= 2) {
      suggestedChartType = 'scatter';
      xColumn = nonIdNumerics[0];
      yColumn = nonIdNumerics[1];
    } else if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
      suggestedChartType = 'bar';
      xColumn = categoricalColumns[0];
      yColumn = numericColumns[0];
    }

    return {
      rowCount: rows.length,
      columnCount: columns.length,
      numericColumns,
      categoricalColumns,
      dateColumns,
      summaryStats: Object.keys(summaryStats).length > 0 ? summaryStats : undefined,
      suggestedChartType,
      xColumn,
      yColumn
    };
  }

  public static getSampleSqlScript(): string {
    return `-- ==============================================================================
-- AI Database Agent - Sample MySQL Relational Database (retail_store)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS retail_store;
USE retail_store;

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    signup_date DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create orders table with foreign keys
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Completed',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Seed Customers Data
-- ------------------------------------------------------------------------------
INSERT INTO customers (customer_id, name, email, city, state, signup_date) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@example.in', 'Pune', 'Maharashtra', '2023-01-15'),
(2, 'Diya Patel', 'diya.patel@example.in', 'Mumbai', 'Maharashtra', '2023-02-10'),
(3, 'Rohan Gupta', 'rohan.gupta@example.in', 'Bengaluru', 'Karnataka', '2023-03-05'),
(4, 'Ananya Iyer', 'ananya.iyer@example.in', 'Chennai', 'Tamil Nadu', '2023-03-22'),
(5, 'Kabir Verma', 'kabir.verma@example.in', 'Delhi', 'Delhi', '2023-04-12'),
(6, 'Pooja Nair', 'pooja.nair@example.in', 'Pune', 'Maharashtra', '2023-05-01'),
(7, 'Vikram Singh', 'vikram.singh@example.in', 'Hyderabad', 'Telangana', '2023-06-18'),
(8, 'Neha Joshi', 'neha.joshi@example.in', 'Pune', 'Maharashtra', '2023-07-04'),
(9, 'Siddharth Rao', 'siddharth.rao@example.in', 'Bengaluru', 'Karnataka', '2023-08-11'),
(10, 'Meera Kulkarni', 'meera.k@example.in', 'Mumbai', 'Maharashtra', '2023-09-09'),
(11, 'Arjun Das', 'arjun.das@example.in', 'Kolkata', 'West Bengal', '2023-10-14'),
(12, 'Sneha Reddy', 'sneha.reddy@example.in', 'Hyderabad', 'Telangana', '2023-11-20');

-- ------------------------------------------------------------------------------
-- Seed Products Data (Includes items with zero orders to test outer joins)
-- ------------------------------------------------------------------------------
INSERT INTO products (product_id, name, category, price, stock_quantity) VALUES
(101, 'Ultra HD 4K Smart TV', 'Electronics', 42999.00, 25),
(102, 'Noise-Cancelling Headphones', 'Electronics', 14999.00, 80),
(103, 'Ergonomic Mesh Chair', 'Furniture', 12499.00, 45),
(104, 'Solid Wood Study Desk', 'Furniture', 18999.00, 20),
(105, 'Wireless Mechanical Keyboard', 'Electronics', 6499.00, 110),
(106, 'Stainless Steel Espresso Machine', 'Appliances', 21999.00, 30),
(107, 'Air Fryer 4.5L Digital', 'Appliances', 5999.00, 65),
(108, 'Pro Running Shoes', 'Apparel', 4599.00, 90),
(109, 'Water-Resistant Hiking Backpack', 'Apparel', 3299.00, 140),
(110, 'Smart Fitness Band Pro', 'Electronics', 2999.00, 200),
(111, 'Vintage Analog Turntable', 'Electronics', 28999.00, 15),
(112, 'Smart Hydroponic Indoor Garden', 'Home', 15999.00, 12);

-- ------------------------------------------------------------------------------
-- Seed Orders Data
-- ------------------------------------------------------------------------------
INSERT INTO orders (order_id, customer_id, product_id, quantity, total_amount, order_date, status) VALUES
(1001, 1, 101, 1, 42999.00, '2023-11-01', 'Completed'),
(1002, 1, 102, 1, 14999.00, '2023-11-15', 'Completed'),
(1003, 2, 106, 2, 43998.00, '2023-11-20', 'Completed'),
(1004, 2, 103, 1, 12499.00, '2023-12-05', 'Completed'),
(1005, 3, 105, 2, 12998.00, '2023-12-10', 'Completed'),
(1006, 3, 101, 1, 42999.00, '2024-01-02', 'Completed'),
(1007, 4, 108, 2, 9198.00, '2024-01-12', 'Completed'),
(1008, 5, 104, 1, 18999.00, '2024-01-18', 'Completed'),
(1009, 5, 107, 1, 5999.00, '2024-01-25', 'Completed'),
(1010, 6, 102, 1, 14999.00, '2024-02-01', 'Completed'),
(1011, 6, 105, 1, 6499.00, '2024-02-14', 'Completed'),
(1012, 7, 101, 1, 42999.00, '2024-02-20', 'Completed'),
(1013, 7, 106, 1, 21999.00, '2024-02-28', 'Completed'),
(1014, 8, 107, 2, 11998.00, '2024-03-05', 'Completed'),
(1015, 8, 109, 3, 9897.00, '2024-03-12', 'Completed'),
(1016, 9, 103, 2, 24998.00, '2024-03-15', 'Completed'),
(1017, 9, 110, 4, 11996.00, '2024-03-22', 'Completed'),
(1018, 10, 104, 1, 18999.00, '2024-04-01', 'Completed'),
(1019, 10, 106, 1, 21999.00, '2024-04-10', 'Completed'),
(1020, 11, 108, 1, 4599.00, '2024-04-18', 'Completed'),
(1021, 12, 102, 2, 29998.00, '2024-04-25', 'Completed'),
(1022, 2, 101, 1, 42999.00, '2024-05-02', 'Completed'),
(1023, 3, 106, 1, 21999.00, '2024-05-15', 'Completed'),
(1024, 5, 103, 1, 12499.00, '2024-05-20', 'Completed'),
(1025, 7, 104, 1, 18999.00, '2024-06-01', 'Completed');

-- ------------------------------------------------------------------------------
-- Recommended Read-Only MySQL User Creation Script
-- ------------------------------------------------------------------------------
-- CREATE USER 'read_only_agent'@'%' IDENTIFIED BY 'YourStrongPassword123!';
-- GRANT SELECT ON retail_store.* TO 'read_only_agent'@'%';
-- FLUSH PRIVILEGES;
`;
  }
}
