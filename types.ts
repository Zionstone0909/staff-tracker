// --------------------------------------------------
// ROLES
// --------------------------------------------------
export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

// --------------------------------------------------
// USERS & INVITATIONS
// --------------------------------------------------
export interface User {
  id: string;
  name: string;
  email: string; // Firebase Auth
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface Invitation {
  token: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  status: 'PENDING' | 'USED';
  createdBy: string;
}

// --------------------------------------------------
// PRODUCTS
// --------------------------------------------------
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  minStockLevel: number;
  createdBy?: string;
  createdByName?: string;
}

// --------------------------------------------------
// CUSTOMERS
// --------------------------------------------------
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  balance: number;
  lastVisit: string;
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdByName?: string;
}

// --------------------------------------------------
// SUPPLIERS
// --------------------------------------------------
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdByName?: string;
}

// --------------------------------------------------
// SALES
// --------------------------------------------------
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  amountPaid: number;
  paymentMethod?: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  initiatedBy?: string;
  initiatedByName?: string;
}

// --------------------------------------------------
// LOGS / AUDIT
// --------------------------------------------------
export interface Log {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
  userName: string;
}

// --------------------------------------------------
// STOCK MOVEMENTS
// --------------------------------------------------
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type:
    | 'RESTOCK'
    | 'SALE'
    | 'CORRECTION'
    | 'RETURN'
    | 'DAMAGE'
    | 'LOSS'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'INTERNAL_USE';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  userId: string;
  userName: string;
}

// --------------------------------------------------
// SUPPLIER TRANSACTIONS
// --------------------------------------------------
export interface SupplierTransactionItem {
  productId: string;
  productName?: string;
  quantity: number;
  cost: number;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  type: 'SUPPLY' | 'PAYMENT' | 'EXPENSE';
  amount: number;
  description: string;
  reference?: string;
  items?: SupplierTransactionItem[];
  initiatedBy?: string;
  initiatedByName?: string;
}

// --------------------------------------------------
// EXPENSES
// --------------------------------------------------
export interface Expense {
  id: string;
  type: 'EXPENSE' | 'DEPOSIT';
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  status: 'Paid' | 'Pending';
  supplierId?: string;
  recordedBy?: string;
  recordedByName?: string;
}

// --------------------------------------------------
// PAYROLL
// --------------------------------------------------
export interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status?: 'Paid' | 'Pending';
  processedBy?: string;
  processedByName?: string;
}
