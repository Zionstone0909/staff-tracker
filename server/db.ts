import sql from 'mssql';

// Use environment variables for configuration so the app can run in different environments (local, Vercel, Docker, etc.)
const config: sql.config = {
    user: process.env.DB_USER || process.env.SQL_USER || 'sa',
    password: process.env.DB_PASSWORD || process.env.SQL_PASSWORD || '',
    server: process.env.DB_SERVER || process.env.SQL_SERVER || 'localhost',
    database: process.env.DB_NAME || process.env.SQL_DATABASE || 'master',
    options: {
        encrypt: (process.env.DB_ENCRYPT || 'true').toLowerCase() === 'true',
        trustServerCertificate: (process.env.DB_TRUST_CERT || 'true').toLowerCase() === 'true'
    },
    pool: {
        max: Number(process.env.DB_POOL_MAX || 10),
        min: Number(process.env.DB_POOL_MIN || 0),
        idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS || 30000)
    }
};

// Keep a global pool reference to support serverless environments (re-use across invocations)
declare global {
    // eslint-disable-next-line no-var
    var __mssqlPool: sql.ConnectionPool | undefined;
}

export async function getPool(): Promise<sql.ConnectionPool> {
    try {
        if (global.__mssqlPool && global.__mssqlPool.connected) return global.__mssqlPool;
        const pool = await new sql.ConnectionPool(config).connect();
        global.__mssqlPool = pool;
        console.log('Connected to SQL Server successfully.');
        return pool;
    } catch (err) {
        console.error('Database Connection Failed:', err);
        throw err;
    }
}

/**
 * Helper examples kept for convenience. For Vercel, prefer keeping server logic in serverless functions
 * or deploying the API separately. These helpers expect a table named `Deposits` to exist.
 */
export async function addExpense(expenseData: any) {
    try {
        const connection = await getPool();
        const result = await connection.request()
            .input('type', sql.NVarChar, expenseData.type)
            .input('date', sql.Date, expenseData.date)
            .input('category', sql.NVarChar, expenseData.category)
            .input('description', sql.NVarChar, expenseData.description)
            .input('amount', sql.Decimal(18, 2), expenseData.amount)
            .input('paymentMethod', sql.NVarChar, expenseData.paymentMethod)
            .input('reference', sql.NVarChar, expenseData.reference)
            .input('status', sql.NVarChar, expenseData.status)
            .query(`
                INSERT INTO Deposits (type, date, category, description, amount, paymentMethod, reference, status)
                OUTPUT INSERTED.*
                VALUES (@type, @date, @category, @description, @amount, @paymentMethod, @reference, @status)
            `);
        return result.recordset[0];
    } catch (err) {
        console.error('Error inserting expense:', err);
        throw err;
    }
}

export async function getExpenses() {
    try {
        const connection = await getPool();
        const result = await connection.request()
            .query('SELECT * FROM Deposits ORDER BY date DESC');
        return result.recordset;
    } catch (err) {
        console.error('Error fetching expenses:', err);
        throw err;
    }
}

export { sql };
