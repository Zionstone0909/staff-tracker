import express, { Request, Response } from 'express';
import cors from 'cors';
import { sql, getPool } from './db.ts'; // explicit extension for ESM resolution
import { initializeDatabase } from './schema.ts';
import expenseRoutes from './api/expenses/expenses.routes.ts';
import customersRoutes from './api/customers.routes.ts';
import suppliersRoutes from './api/suppliers.routes.ts';
import productsRoutes from './api/products.routes.ts';
import salesRoutes from './api/sales.routes.ts';
import payrollRoutes from './api/payroll.routes.ts';
import inventoryRoutes from './api/inventory.routes.ts';
import staffRoutes from './api/staff.routes.ts';
import logsRoutes from './api/logs.routes.ts';
import activityFeedRoutes from './api/activityFeed.routes.ts';
import supplierTransactionsRoutes from './api/supplierTransactions.routes.ts';
import usersRoutes from './api/users.routes.ts';
import invitationsRoutes from './api/invitations.routes.ts';

// --- Type Definitions ---
interface ClientDeposit {
    type?: 'DEPOSIT';
    category?: string;
    description: string;
    reference?: string | null;
    amount: number;
    paymentMethod?: string;
    status?: string;
    date: string; 
    recordedByName?: string | null;
}

interface DbDeposit extends ClientDeposit {
    id: number;
    createdAt: Date;
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// --- Middleware ---
app.use(cors()); 
app.use(express.json());

// Mount expenses routes so frontend can reach /api/expenses
app.use('/api/expenses', expenseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/activity-feed', activityFeedRoutes);
app.use('/api/supplierTransactions', supplierTransactionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/invitations', invitationsRoutes);

/**
 * Initialize the database connection pool once when the server starts.
 * This prevents the "pool is undefined" error during the first request.
 */
let dbAvailable = false;
// In-memory fallback storage for development when DB is unavailable
let inMemoryDeposits: DbDeposit[] = [];
let inMemoryIdCounter = 1;

const initialize = async () => {
    try {
        await getPool();
        dbAvailable = true;
        console.log("Database connection pool established successfully.");
    } catch (err) {
        dbAvailable = false;
        console.error("WARNING: Failed to initialize database connection:", err);
        console.error("Continuing without DB connection — API endpoints will return errors until DB is available.");
    }
    return dbAvailable;
}

// ----------------------------------------------------------------------
// POST /api/deposits (Create New Record)
// ----------------------------------------------------------------------
app.post('/api/deposits', async (req: Request<{}, {}, ClientDeposit>, res: Response) => {
    const { 
        description, amount, date, 
        type = 'DEPOSIT', 
        category = 'Income', 
        reference = null, 
        paymentMethod = 'Bank Transfer', 
        status = 'Paid', 
        recordedByName = 'System' 
    } = req.body;
    
    if (!description || amount === undefined || !date) {
        return res.status(400).send({ error: "Missing required fields: description, amount, or date." });
    }

    try {
        if (!dbAvailable) {
            // Use in-memory fallback
            const newRec: DbDeposit = {
                id: inMemoryIdCounter++,
                type,
                category,
                description,
                reference: reference as any,
                amount,
                paymentMethod,
                status,
                date,
                recordedByName: recordedByName as any,
                createdAt: new Date()
            };
            inMemoryDeposits.unshift(newRec);
            return res.status(201).json(newRec);
        }

        const pool: sql.ConnectionPool = await getPool(); 
        const request = pool.request();
        
        // Parameter Mapping
        request.input('type', sql.VarChar(20), type);
        request.input('category', sql.VarChar(50), category);
        request.input('description', sql.NVarChar(255), description);
        request.input('reference', sql.NVarChar(100), reference); 
        request.input('amount', sql.Decimal(18, 2), amount);
        request.input('paymentMethod', sql.VarChar(50), paymentMethod);
        request.input('status', sql.VarChar(20), status);
        request.input('date', sql.Date, date);
        request.input('recordedByName', sql.NVarChar(100), recordedByName);
        
        const result = await request.query(`
            INSERT INTO Expenses (
                type, category, description, reference, amount, paymentMethod, status, [date], recordedByName, createdAt
            )
            OUTPUT inserted.*
            VALUES (
                @type, @category, @description, @reference, @amount, @paymentMethod, @status, @date, @recordedByName, GETDATE()
            )
        `);

        res.status(201).json(result.recordset[0]); 
        
    } catch (err: any) {
        console.error("SQL INSERT Error:", err);
        res.status(500).send({ error: `Database Error: ${err.message}` });
    }
});

// ----------------------------------------------------------------------
// GET /api/deposits (Load Deposit History)
// ----------------------------------------------------------------------
app.get('/api/deposits', async (req: Request, res: Response) => {
    const searchTerm = req.query.search as string || ''; 
    const searchParam = `%${searchTerm}%`;

    try {
        if (!dbAvailable) {
            const lower = searchTerm.toLowerCase();
            const filtered = inMemoryDeposits.filter(d => {
                if (!lower) return true;
                return (d.description || '').toLowerCase().includes(lower) || (d.reference || '').toLowerCase().includes(lower);
            });
            return res.json(filtered);
        }

        const pool: sql.ConnectionPool = await getPool(); 
        const request = pool.request();
        
        request.input('search', sql.NVarChar, searchParam);
        
        // This query fetches the history that the frontend is requesting
        const result = await request.query(`
            SELECT * FROM Expenses 
            WHERE 
                type='DEPOSIT'
                AND (description LIKE @search OR reference LIKE @search)
            ORDER BY 
                [date] DESC, createdAt DESC
        `);
            
        res.json(result.recordset);
    } catch (err: any) {
        console.error("SQL GET Error (History):", err);
        res.status(500).send({ error: `Database Error: ${err.message}` });
    }
});

// Start the server after DB connection and schema initialization
initialize().then(async () => {
    if (dbAvailable) {
        const schemaReady = await initializeDatabase();
        if (!schemaReady) {
            console.warn('Schema initialization failed, but server will continue.');
        }
    }
    
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        if (!dbAvailable) {
            console.warn('Server started without DB connection. Some endpoints may fail.');
        }
    });
});
