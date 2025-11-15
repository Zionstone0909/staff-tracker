import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "business_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000, // notice no "Ms" at end
})

// Test the connection
pool.getConnection()
  .then(() => console.log("[v0] Database pool created successfully"))
  .catch((err) => console.error("[v0] Pool creation error:", err))

export async function query(sql: string, params: any[] = []) {
  const connection = await pool.getConnection()
  try {
    const [results] = await connection.execute(sql, params)
    return results
  } finally {
    connection.release()
  }
}

export default pool
