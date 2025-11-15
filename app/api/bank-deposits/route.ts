import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

// Create a singleton Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Zod schema for input validation
const depositSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
})

// Helper: get user from JWT
const getUserFromToken = (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return null
  const token = authHeader.replace("Bearer ", "")
  try {
    const secret = process.env.JWT_SECRET || "secret"
    return jwt.verify(token, secret) as { id: number; role: string }
  } catch {
    return null
  }
}

// Deposit type
interface Deposit {
  id: number
  amount: number
  description: string
  initiated_at: Date
  staffId: number
}

// GET /api/bank-deposits
export async function GET(req: NextRequest) {
  const user = getUserFromToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    let deposits: Deposit[] = []

    if (user.role === "admin") {
      deposits = await prisma.deposit.findMany()
    } else {
      deposits = await prisma.deposit.findMany({
        where: { staffId: user.id },
      })
    }

    const total = deposits.reduce((sum, d) => sum + d.amount, 0)

    // Convert initiated_at to string for JSON
    const depositsJson = deposits.map(d => ({
      ...d,
      initiated_at: d.initiated_at.toISOString(),
    }))

    return NextResponse.json({ deposits: depositsJson, total })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch deposits" }, { status: 500 })
  }
}

// POST /api/bank-deposits
export async function POST(req: NextRequest) {
  const user = getUserFromToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const parseResult = depositSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const deposit = await prisma.deposit.create({
      data: {
        ...parseResult.data,
        staffId: user.id, // link to the current staff
      },
    })

    // Convert initiated_at to string for JSON
    const depositJson = { ...deposit, initiated_at: deposit.initiated_at.toISOString() }

    return NextResponse.json(depositJson, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 })
  }
}

// DELETE /api/bank-deposits?id=123 (admin-only)
export async function DELETE(req: NextRequest) {
  const user = getUserFromToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const url = new URL(req.url)
    const idParam = url.searchParams.get("id")
    if (!idParam) return NextResponse.json({ error: "Deposit ID required" }, { status: 400 })

    const depositId = parseInt(idParam)
    await prisma.deposit.delete({ where: { id: depositId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to delete deposit" }, { status: 500 })
  }
}

// Fallback for unimplemented methods
export async function PUT() {
  return new Response("Method Not Allowed", { status: 405 })
}
