-- =========================================s=======================================
-- Jireh Fishes - SQL Server Schema
-- Execute this script in SQL Server Management Studio 22
-- ================================================================================

-- 1. USERS TABLE
CREATE TABLE [Users] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255) NOT NULL UNIQUE,
    [role] NVARCHAR(50) NOT NULL CHECK ([role] IN ('ADMIN', 'STAFF')),
    [isActive] BIT NOT NULL DEFAULT 1,
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 2. CUSTOMERS TABLE
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
CREATE TABLE [Sales] (
    [id] NVARCHAR(255) PRIMARY KEY,
    [customerId] NVARCHAR(255),
    [customerName] NVARCHAR(255),
    [total] DECIMAL(18, 2) NOT NULL,
    [amountPaid] DECIMAL(18, 2) NOT NULL,
    [paymentMethod] NVARCHAR(50),
    [date] DATE NOT NULL,
    [items] NVARCHAR(MAX), -- JSON array stored as string
    [notes] NVARCHAR(MAX),
    [initiatedBy] NVARCHAR(255),
    [initiatedByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([customerId]) REFERENCES [Customers]([id])
);

-- 6. EXPENSES TABLE
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
CREATE TABLE [SupplierTransactions] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [supplierId] NVARCHAR(255) NOT NULL,
    [supplierName] NVARCHAR(255),
    [type] NVARCHAR(50) CHECK ([type] IN ('SUPPLY', 'EXPENSE', 'PAYMENT')) DEFAULT 'SUPPLY',
    [amount] DECIMAL(18, 2) NOT NULL,
    [description] NVARCHAR(255),
    [reference] NVARCHAR(100),
    [items] NVARCHAR(MAX), -- JSON array of {productId, quantity, cost, productName}
    [date] DATE NOT NULL,
    [initiatedBy] NVARCHAR(255),
    [initiatedByName] NVARCHAR(255),
    [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([supplierId]) REFERENCES [Suppliers]([id])
);

-- 8. STOCK MOVEMENTS TABLE
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

-- 10. STOCK MOVEMENTS TABLE
CREATE TABLE [Logs] (
    [id] INT PRIMARY KEY IDENTITY(1,1),
    [action] NVARCHAR(100) NOT NULL,
    [details] NVARCHAR(MAX),
    [userId] NVARCHAR(255),
    [userName] NVARCHAR(255),
    [timestamp] DATETIME NOT NULL DEFAULT GETDATE()
);

-- 11. INVITATIONS TABLE
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

-- Indexes for frequently searched/filtered fields
CREATE INDEX [idx_Expenses_Date] ON [Expenses]([date]);
CREATE INDEX [idx_Expenses_Type] ON [Expenses]([type]);
CREATE INDEX [idx_Expenses_SupplierId] ON [Expenses]([supplierId]);

CREATE INDEX [idx_Sales_CustomerId] ON [Sales]([customerId]);
CREATE INDEX [idx_Sales_Date] ON [Sales]([date]);

CREATE INDEX [idx_SupplierTransactions_SupplierId] ON [SupplierTransactions]([supplierId]);
CREATE INDEX [idx_SupplierTransactions_Date] ON [SupplierTransactions]([date]);
CREATE INDEX [idx_SupplierTransactions_Type] ON [SupplierTransactions]([type]);

CREATE INDEX [idx_StockMovements_ProductId] ON [StockMovements]([productId]);
CREATE INDEX [idx_StockMovements_Date] ON [StockMovements]([date]);
CREATE INDEX [idx_StockMovements_Type] ON [StockMovements]([type]);

CREATE INDEX [idx_Payroll_PaymentDate] ON [Payroll]([paymentDate]);

CREATE INDEX [idx_Logs_Timestamp] ON [Logs]([timestamp]);
CREATE INDEX [idx_Logs_UserId] ON [Logs]([userId]);

CREATE INDEX [idx_Invitations_Status] ON [Invitations]([status]);
CREATE INDEX [idx_Invitations_CreatedBy] ON [Invitations]([createdBy]);

-- ================================================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================================================

-- Sample User
INSERT INTO [Users] ([id], [name], [email], [role], [isActive])
VALUES ('admin-001', 'Admin User', 'admin@jireh.com', 'ADMIN', 1);

-- Sample Supplier
INSERT INTO [Suppliers] ([id], [name], [contactPerson], [email], [phone], [address], [status], [createdBy], [createdByName])
VALUES ('supplier-001', 'Fish Wholesaler Ltd', 'John Doe', 'john@supplier.com', '+2348012345678', '123 Market St', 'Active', 'admin-001', 'Admin User');

-- Sample Product
INSERT INTO [Products] ([id], [name], [sku], [description], [category], [price], [cost], [quantity], [reorderLevel], [supplier], [createdBy], [createdByName])
VALUES ('product-001', 'Fresh Tilapia', 'SKU-001', 'High quality tilapia fish', 'Fish', 5000.00, 3000.00, 100, 20, 'supplier-001', 'admin-001', 'Admin User');

-- Sample Customer
INSERT INTO [Customers] ([id], [name], [email], [phone], [address], [totalSpent], [balance], [createdBy], [createdByName])
VALUES ('customer-001', 'John Fish Shop', 'john@fishop.com', '+2349876543210', '456 Retail Road', 0, 0, 'admin-001', 'Admin User');

PRINT 'Database schema created successfully!';
PRINT 'All tables are ready for use.';
