import { sql } from 'mssql';
import { getPool } from './db.ts';

/**
 * Database Schema Initialization Script
 * Creates all tables if they don't exist
 */

const schema = `
-- ================================================================================
-- Jireh Fishes - SQL Server Schema
-- ================================================================================

-- 1. USERS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
CREATE TABLE [Users] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255) NOT NULL UNIQUE,
    [role] NVARCHAR(50) NOT NULL CHECK ([role] IN ('ADMIN', 'STAFF')),
    [isActive] BIT NOT NULL DEFAULT 1,
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 2. CUSTOMERS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
CREATE TABLE [Customers] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255),
    [phone] NVARCHAR(20),
    [address] NVARCHAR(MAX),
    [totalSpent] DECIMAL(18, 2) DEFAULT 0,
    [balance] DECIMAL(18, 2) DEFAULT 0,
    [lastVisit] DATETIME,
    [createdBy] NVARCHAR(255),
    [createdByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 3. SUPPLIERS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Suppliers')
CREATE TABLE [Suppliers] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [contactPerson] NVARCHAR(255),
    [email] NVARCHAR(255),
    [phone] NVARCHAR(20),
    [address] NVARCHAR(MAX),
    [status] NVARCHAR(50) CHECK ([status] IN ('Active', 'Inactive')) DEFAULT 'Active',
    [createdBy] NVARCHAR(255),
    [createdByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 4. PRODUCTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
CREATE TABLE [Products] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [sku] NVARCHAR(100) UNIQUE,
    [description] NVARCHAR(MAX),
    [category] NVARCHAR(100),
    [price] DECIMAL(18, 2) NOT NULL,
    [cost] DECIMAL(18, 2),
    [quantity] INT DEFAULT 0,
    [reorderLevel] INT DEFAULT 10,
    [supplier] NVARCHAR(255),
    [createdBy] NVARCHAR(255),
    [createdByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 5. SALES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales')
CREATE TABLE [Sales] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [customerId] NVARCHAR(255),
    [customerName] NVARCHAR(255),
    [total] DECIMAL(18, 2) NOT NULL,
    [amountPaid] DECIMAL(18, 2) NOT NULL,
    [paymentMethod] NVARCHAR(50),
    [date] DATE NOT NULL,
    [items] NVARCHAR(MAX),
    [notes] NVARCHAR(MAX),
    [initiatedBy] NVARCHAR(255),
    [initiatedByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([customerId]) REFERENCES [Customers]([id])
);

-- 6. STAFF TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
CREATE TABLE [Staff] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255),
    [phone] NVARCHAR(20),
    [position] NVARCHAR(100),
    [salary] DECIMAL(18, 2),
    [status] NVARCHAR(50) CHECK ([status] IN ('Active', 'Inactive')) DEFAULT 'Active',
    [createdBy] NVARCHAR(255),
    [createdByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 7. EXPENSES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses')
CREATE TABLE [Expenses] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [type] NVARCHAR(20) CHECK ([type] IN ('EXPENSE', 'DEPOSIT')) DEFAULT 'EXPENSE',
    [category] NVARCHAR(100),
    [description] NVARCHAR(255) NOT NULL,
    [reference] NVARCHAR(100),
    [amount] DECIMAL(18, 2) NOT NULL,
    [paymentMethod] NVARCHAR(50),
    [status] NVARCHAR(20) CHECK ([status] IN ('Paid', 'Pending')) DEFAULT 'Paid',
    [supplierId] NVARCHAR(255),
    [date] DATE NOT NULL,
    [recordedBy] NVARCHAR(255),
    [recordedByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([supplierId]) REFERENCES [Suppliers]([id])
);

-- 7. SUPPLIER TRANSACTIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SupplierTransactions')
CREATE TABLE [SupplierTransactions] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [supplierId] NVARCHAR(255) NOT NULL,
    [supplierName] NVARCHAR(255),
    [type] NVARCHAR(50) CHECK ([type] IN ('SUPPLY', 'EXPENSE', 'PAYMENT')) DEFAULT 'SUPPLY',
    [amount] DECIMAL(18, 2) NOT NULL,
    [description] NVARCHAR(255),
    [reference] NVARCHAR(100),
    [items] NVARCHAR(MAX),
    [date] DATE NOT NULL,
    [initiatedBy] NVARCHAR(255),
    [initiatedByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([supplierId]) REFERENCES [Suppliers]([id])
);

-- 8. STOCK MOVEMENTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockMovements')
CREATE TABLE [StockMovements] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [productId] NVARCHAR(255) NOT NULL,
    [productName] NVARCHAR(255),
    [type] NVARCHAR(50) CHECK ([type] IN ('RESTOCK', 'SALE', 'ADJUSTMENT', 'CORRECTION')) DEFAULT 'RESTOCK',
    [quantity] INT NOT NULL,
    [previousStock] INT DEFAULT 0,
    [newStock] INT DEFAULT 0,
    [reason] NVARCHAR(255),
    [date] DATE NOT NULL,
    [userId] NVARCHAR(255),
    [userName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([productId]) REFERENCES [Products]([id])
);

-- 9. PAYROLL TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payroll')
CREATE TABLE [Payroll] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [staffName] NVARCHAR(255) NOT NULL,
    [department] NVARCHAR(100),
    [position] NVARCHAR(100),
    [amount] DECIMAL(18, 2) NOT NULL,
    [paymentMethod] NVARCHAR(50),
    [paymentDate] DATE NOT NULL,
    [reference] NVARCHAR(100),
    [notes] NVARCHAR(MAX),
    [processedBy] NVARCHAR(255),
    [processedByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 10. LOGS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Logs')
CREATE TABLE [Logs] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [action] NVARCHAR(100) NOT NULL,
    [details] NVARCHAR(MAX),
    [userId] NVARCHAR(255),
    [userName] NVARCHAR(255),
    [timestamp] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 11. INVITATIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invitations')
CREATE TABLE [Invitations] (
    [token] NVARCHAR(255) PRIMARY KEY,
    [email] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [role] NVARCHAR(50) NOT NULL CHECK ([role] IN ('ADMIN', 'STAFF')),
    [status] NVARCHAR(50) CHECK ([status] IN ('PENDING', 'USED', 'REVOKED')) DEFAULT 'PENDING',
    [createdBy] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- ================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================

-- Only create date index if column exists
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Expenses_Date')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'date')
CREATE INDEX [idx_Expenses_Date] ON [Expenses]([date]);

-- Only create type index if column exists
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Expenses_Type')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'type')
CREATE INDEX [idx_Expenses_Type] ON [Expenses]([type]);

-- Create indexes only if the referenced table and column exist. This prevents failures on older schemas.
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses')
BEGIN
    -- Ensure supplierId column exists, add if missing
    IF COL_LENGTH('Expenses', 'supplierId') IS NULL
    BEGIN
        PRINT 'Adding missing column [supplierId] to [Expenses]';
        ALTER TABLE [Expenses] ADD [supplierId] NVARCHAR(255) NULL;
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Expenses_SupplierId')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'supplierId')
    BEGIN
        CREATE INDEX [idx_Expenses_SupplierId] ON [Expenses]([supplierId]);
    END
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Sales_CustomerId')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'customerId')
    BEGIN
        CREATE INDEX [idx_Sales_CustomerId] ON [Sales]([customerId]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Sales_Date')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'date')
    BEGIN
        CREATE INDEX [idx_Sales_Date] ON [Sales]([date]);
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SupplierTransactions')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_SupplierTransactions_SupplierId')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupplierTransactions') AND name = 'supplierId')
    BEGIN
        CREATE INDEX [idx_SupplierTransactions_SupplierId] ON [SupplierTransactions]([supplierId]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_SupplierTransactions_Date')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupplierTransactions') AND name = 'date')
    BEGIN
        CREATE INDEX [idx_SupplierTransactions_Date] ON [SupplierTransactions]([date]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_SupplierTransactions_Type')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SupplierTransactions') AND name = 'type')
    BEGIN
        CREATE INDEX [idx_SupplierTransactions_Type] ON [SupplierTransactions]([type]);
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'StockMovements')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_StockMovements_ProductId')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StockMovements') AND name = 'productId')
    BEGIN
        CREATE INDEX [idx_StockMovements_ProductId] ON [StockMovements]([productId]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_StockMovements_Date')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StockMovements') AND name = 'date')
    BEGIN
        CREATE INDEX [idx_StockMovements_Date] ON [StockMovements]([date]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_StockMovements_Type')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StockMovements') AND name = 'type')
    BEGIN
        CREATE INDEX [idx_StockMovements_Type] ON [StockMovements]([type]);
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Payroll')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Payroll_PaymentDate')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payroll') AND name = 'paymentDate')
    BEGIN
        CREATE INDEX [idx_Payroll_PaymentDate] ON [Payroll]([paymentDate]);
    END
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Logs')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Logs_Timestamp')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Logs') AND name = 'timestamp')
    BEGIN
        CREATE INDEX [idx_Logs_Timestamp] ON [Logs]([timestamp]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Logs_UserId')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Logs') AND name = 'userId')
    BEGIN
        CREATE INDEX [idx_Logs_UserId] ON [Logs]([userId]);
    END
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Invitations')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Invitations_Status')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invitations') AND name = 'status')
    BEGIN
        CREATE INDEX [idx_Invitations_Status] ON [Invitations]([status]);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_Invitations_CreatedBy')
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invitations') AND name = 'createdBy')
    BEGIN
        CREATE INDEX [idx_Invitations_CreatedBy] ON [Invitations]([createdBy]);
    END
END
`;

export async function initializeDatabase() {
  try {
    const pool = await getPool();
    
        // Split schema by GO statements and execute each batch.
        // Execute batches one-by-one and continue on errors (log them) so a single failing batch doesn't stop initialization.
        const batches = schema.split('GO');

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const trimmedBatch = batch.trim();
            if (trimmedBatch.length === 0) continue;

            try {
                console.log(`Executing schema batch ${i + 1}/${batches.length}`);
                await pool.request().query(trimmedBatch);
            } catch (batchErr: any) {
                console.error(`Schema batch ${i + 1} failed:`, batchErr.message || batchErr);
                // Log the first ~300 chars of the batch for context
                console.error('Batch preview:', (trimmedBatch.length > 300) ? trimmedBatch.slice(0, 300) + '...' : trimmedBatch);
                // Continue to next batch instead of throwing
            }
        }

        console.log('✓ Database schema initialization completed (some batches may have failed)');
        return true;
  } catch (err: any) {
    console.error('✗ Database initialization failed:', err.message);
    return false;
  }
}
