# 🗄️ AI Database Agent — SQL Query & Analytics Assistant

An enterprise-grade, portfolio-level **AI Database Agent** that empowers users to communicate with relational databases using natural language. It inspects database schemas dynamically, generates safe, optimized MySQL queries using **free-tier Gemini Flash**, enforces multi-layer AST and security validations, executes read-only queries with human-in-the-loop approval, visualizes datasets, and explains SQL mechanics in plain English.

---

## 🌟 Key Features

- **Natural Language to SQL**: Converts natural language prompts (e.g., *"Top 5 customers by total spending"*, *"Show sales by city"*, *"Which products have never been ordered?"*) into accurate MySQL queries.
- **Dynamic Schema Discovery**: Auto-introspects table structures, column types, primary keys, and foreign-key relationships from `INFORMATION_SCHEMA` without hardcoding.
- **Multi-Layer SQL Security Guard**:
  - Strict read-only enforcement (only `SELECT` and `WITH ... SELECT`).
  - Blocks all DDL/DML mutations (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `GRANT`, `CALL`, etc.).
  - Obfuscation prevention (blocks SQL comments `--`, `/* */`, `#`, and multi-statement semicolon injection).
  - Schema table validation against hallucinations.
  - Automatic `LIMIT 100` injection and capping at `LIMIT 500`.
  - 5,000ms query timeout to prevent Denial-of-Service attacks.
- **Human-in-the-Loop SQL Approval**: Preview generated SQL, schema relationships, safety checklist, and reasoning summary before explicit user approval.
- **Dual Database Architecture**:
  - **Built-in Relational Store**: In-memory relational database seeded with realistic retail e-commerce data (`customers`, `products`, `orders`) for immediate, zero-setup testing.
  - **External MySQL Support**: Connection pooling via `mysql2/promise` with read-only session enforcement (`SET SESSION TRANSACTION READ ONLY`).
- **Automated Data Analysis & Visualizations**:
  - Automatically selects the optimal visualization (Bar, Line, Donut, Area, Scatter, or Table).
  - Interactive SVG charts with hover tooltips and dynamic metric switchers.
  - Generates summary metrics (Total, Average, Max, Min with currency formatting).
- **AI SQL Error Auto-Correction**: Captures database runtime errors, feeds the error, failed SQL, and schema back to the AI for an auto-corrected query (max 2 attempts) which is re-validated before execution.
- **Conversational Follow-ups**: Supports contextual follow-ups such as *"Only show cities above ₹50,000"* or *"Change that to top 5"*.
- **Plain-English Query Explanation**: Beginner-friendly breakdown of tables used, join keys, where filters, aggregations, and business interpretation.
- **Query History & CSV Export**: Persists query history with execution duration, row counts, and one-click RFC4180 CSV export.

---

## 🏛️ System Architecture

```text
User Question
     │
     ▼
[ Intent Analyzer & Context Planner ]
     │
     ▼
[ Dynamic Schema Retriever ] ◄── (INFORMATION_SCHEMA or Built-in Schema)
     │
     ▼
[ AI SQL Generator (Gemini Flash 3.8) ]
     │
     ▼
[ Multi-Tier Security Validator ]
  ├── Read-Only SELECT Check
  ├── Mutating DDL/DML Blocklist
  ├── SQL Comment & Multi-Query Check
  ├── Schema Table Hallucination Check
  └── Auto LIMIT 100 Injection
     │
     ▼
[ Human Approval / Trusted Mode ]
     │
     ▼
[ Database Execution Engine (MySQL / In-Memory Relational) ]
  ├── Enforce READ-ONLY Session
  ├── 5,000ms Strict Timeout
  └── Exception Interceptor
     │
     ├── (If Execution Error) ──► [ AI Error Corrector (Max 2 Attempts) ] ──► [ Re-Validate ] ──► [ User Approval ]
     │
     ▼
[ Result Analyzer & Statistics ]
     │
     ├──► [ Interactive Visualizer (Bar / Line / Donut / Scatter) ]
     ├──► [ Sortable & Searchable Data Table with CSV Export ]
     └──► [ AI Plain-English Explainer ]
```

---

## 🛡️ Security Hardening & Read-Only User Guide

The application adheres to the principle of least privilege. For production MySQL deployments, always connect using a dedicated read-only database user:

```sql
-- 1. Create a dedicated read-only agent user
CREATE USER 'read_only_agent'@'%' IDENTIFIED BY 'YourStrongPassword123!';

-- 2. Grant only SELECT permissions on target database
GRANT SELECT ON retail_store.* TO 'read_only_agent'@'%';

-- 3. Apply privilege changes
FLUSH PRIVILEGES;
```

---

## 💰 Free-Tier Architecture

This application is built free-tier first:
1. **AI Model**: Uses `gemini-3.8-flash` via the official `@google/genai` TypeScript SDK. Free tier includes up to 15 Requests/Min and 1,500 Requests/Day.
2. **Built-in Database Engine**: Employs an in-memory SQL execution engine seeded with retail data, requiring zero external database hosting fees or credit cards.
3. **External MySQL**: Compatible with free MySQL tiers (e.g., Aiven free MySQL tier, PlanetScale free plan, or local MySQL).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 22)
- npm or yarn

### 2. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Gemini API Key (Obtain free at: https://aistudio.google.com/)
GEMINI_API_KEY="your-gemini-api-key"

# Server Port
PORT=3000
NODE_ENV="development"

# (Optional) External MySQL Connection
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="read_only_agent"
DB_PASSWORD=""
DB_NAME="retail_store"
```

> **Note**: In Google AI Studio web containers, `GEMINI_API_KEY` is automatically injected from user secrets.

### 3. Running the Application
```bash
# Start full-stack web application
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Running the Test Suite
```bash
npx tsx tests/test_sql_validator.ts
```

All 23 security, AST, and database execution tests will execute and report status.

---

## 📊 Sample Database Schema

The built-in sample database provides an e-commerce retail store (`retail_store`):

| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `customers` | Registered retail customers | `customer_id` (PK), `name`, `email`, `city`, `state`, `signup_date` |
| `products` | Retail product catalog | `product_id` (PK), `name`, `category`, `price`, `stock_quantity` |
| `orders` | Purchase order transactions | `order_id` (PK), `customer_id` (FK), `product_id` (FK), `quantity`, `total_amount`, `order_date`, `status` |

You can also view and copy the raw SQL DDL script by clicking **MySQL SQL** in the sidebar or downloading `sample_database.sql`.

---

## 🧪 Example Natural Language Queries

- *"Show the top 5 customers by total purchase amount."*
- *"Show sales by city."*
- *"Which products have never been ordered?"*
- *"Compare monthly revenue."*
- *"What is the average order value?"*
- *"Show customers who spent more than ₹50,000."*
- *"Which category generated the highest revenue?"*
- *"Only show cities above ₹50,000."* (Conversational follow-up)
- *"Change that to top 5."* (Conversational follow-up)

---

## 📝 License
Apache-2.0 License.
