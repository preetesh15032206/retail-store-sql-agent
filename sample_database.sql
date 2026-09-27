-- ==============================================================================
-- AI Database Agent / SQL Assistant - Sample MySQL Database
-- Retail E-Commerce Schema (customers, products, orders)
-- ==============================================================================

-- 1. Create and Switch Database
CREATE DATABASE IF NOT EXISTS retail_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE retail_store;

-- 2. Drop existing tables if recreating
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- 3. Customers Table
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    signup_date DATE NOT NULL,
    INDEX idx_city (city),
    INDEX idx_signup (signup_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Products Table
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    INDEX idx_category (category),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Orders Table
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Completed',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    INDEX idx_order_date (order_date),
    INDEX idx_customer (customer_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Customers
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

-- Products (includes items never ordered to test LEFT JOIN queries)
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

-- Orders
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

-- ==============================================================================
-- SECURITY HARDENING: Create Read-Only User
-- ==============================================================================
-- Run the following commands in MySQL as root/admin to set up a secure read-only user:
--
-- CREATE USER 'read_only_agent'@'%' IDENTIFIED BY 'SetYourStrongPasswordHere_123!';
-- GRANT SELECT ON retail_store.* TO 'read_only_agent'@'%';
-- FLUSH PRIVILEGES;
