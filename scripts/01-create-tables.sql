-- Users/Staff table
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salaries/Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id),
  month VARCHAR(7),
  salary_amount DECIMAL(10,2),
  payment_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transportation & Lorry Expenses
CREATE TABLE IF NOT EXISTS lorry_expenses (
  id SERIAL PRIMARY KEY,
  lorry_id VARCHAR(50),
  expense_type VARCHAR(100),
  amount DECIMAL(10,2),
  description TEXT,
  expense_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Deposits
CREATE TABLE IF NOT EXISTS bank_deposits (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id),
  amount DECIMAL(10,2),
  deposit_date DATE,
  reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Ledger
CREATE TABLE IF NOT EXISTS supplier_ledger (
  id SERIAL PRIMARY KEY,
  supplier_id INT NOT NULL REFERENCES suppliers(id),
  goods_received TEXT,
  quantity INT,
  amount_owed DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  transaction_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  description TEXT,
  amount DECIMAL(10,2),
  transaction_date DATE,
  transaction_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'outstanding',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id),
  customer_id INT REFERENCES customers(id),
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  sale_date DATE,
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  profit DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Items
CREATE TABLE IF NOT EXISTS sales_items (
  id SERIAL PRIMARY KEY,
  sales_id INT NOT NULL REFERENCES sales(id),
  item_name VARCHAR(255),
  quantity INT,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory/Stock
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 0,
  unit_price DECIMAL(10,2),
  total_value DECIMAL(10,2),
  reorder_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movement
CREATE TABLE IF NOT EXISTS stock_movement (
  id SERIAL PRIMARY KEY,
  inventory_id INT NOT NULL REFERENCES inventory(id),
  movement_type VARCHAR(50),
  quantity INT,
  opening_stock INT,
  closing_stock INT,
  movement_date DATE,
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  inventory_id INT NOT NULL REFERENCES inventory(id),
  adjustment_type VARCHAR(50),
  quantity INT,
  reason TEXT,
  adjustment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_records (
  id SERIAL PRIMARY KEY,
  sales_id INT REFERENCES sales(id),
  payment_method VARCHAR(50),
  amount DECIMAL(10,2),
  reference_number VARCHAR(100),
  payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Expenses
CREATE TABLE IF NOT EXISTS company_expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(10,2),
  expense_date DATE,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  sales_id INT NOT NULL REFERENCES sales(id),
  receipt_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  items TEXT,
  total_amount DECIMAL(10,2),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX idx_sales_staff_id ON sales(staff_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_inventory_name ON inventory(item_name);
