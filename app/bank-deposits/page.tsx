"use client"

import { useState, useEffect, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { z } from "zod"

interface Deposit {
  id: number
  amount: number
  description: string
  initiated_at: string
  initiated_by_user_id: number
}

// Zod schema for frontend validation
const depositSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  description: z.string().min(1, "Description is required"),
})

export default function BankDepositsPage() {
  const router = useRouter()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [newDeposit, setNewDeposit] = useState({ amount: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [isFetchingDeposits, setIsFetchingDeposits] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

  // Get JWT token from localStorage
  const getAuthToken = (): string | null => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        return parsedUser.token
      } catch {
        return null
      }
    }
    return null
  }

  const getUserRoleAndId = () => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        setRole(parsedUser.role)
        setUserId(parsedUser.id)
      } catch {
        setRole(null)
        setUserId(null)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    const token = getAuthToken()
    if (!token) {
      router.push("/login")
      return
    }
    getUserRoleAndId()
    fetchDeposits(token)
  }, [])

  const handleInput =
    (field: keyof typeof newDeposit) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewDeposit(prev => ({ ...prev, [field]: e.target.value }))
    }

  // Fetch deposits from API
  const fetchDeposits = async (token: string) => {
    setIsFetchingDeposits(true)
    setError(null)
    try {
      const response = await fetch("/api/bank-deposits", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: Deposit[] = await response.json()
      setDeposits(data)
    } catch (err) {
      console.error("[v1] Error fetching deposits:", err)
      setError("Failed to fetch deposits. Please try again.")
    } finally {
      setIsFetchingDeposits(false)
    }
  }

  // Handle adding a new deposit
  const handleAddDeposit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const token = getAuthToken()
    if (!token) {
      router.push("/login")
      setLoading(false)
      return
    }

    const amountNum = parseFloat(newDeposit.amount)
    const validation = depositSchema.safeParse({
      amount: amountNum,
      description: newDeposit.description,
    })

    if (!validation.success) {
      setError(validation.error.errors.map(err => err.message).join(", "))
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/bank-deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...validation.data, initiated_by_user_id: userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add deposit")
      }

      setNewDeposit({ amount: "", description: "" })
      await fetchDeposits(token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Handle deleting a deposit (admin only)
  const handleDeleteDeposit = async (depositId: number) => {
    if (!confirm("Are you sure you want to delete this deposit?")) return

    const token = getAuthToken()
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`/api/bank-deposits/${depositId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Failed to delete deposit")
      }
      await fetchDeposits(token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bank Deposits</h1>

        {/* Deposit Form (both staff and admin can use) */}
        {role && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Record Bank Deposit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddDeposit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newDeposit.amount}
                    onChange={handleInput("amount")}
                    step="0.01"
                  />
                  <Input
                    type="text"
                    placeholder="Description"
                    value={newDeposit.description}
                    onChange={handleInput("description")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Recording..." : "Record Deposit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Deposits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Deposits Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Initiated At</TableHead>
                    {role === "admin" && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetchingDeposits ? (
                    <TableRow>
                      <TableCell colSpan={role === "admin" ? 5 : 4} className="text-center text-muted-foreground">
                        Loading deposits...
                      </TableCell>
                    </TableRow>
                  ) : deposits.length > 0 ? (
                    deposits
                      .filter(deposit => role === "admin" || deposit.initiated_by_user_id === userId)
                      .map(deposit => (
                        <TableRow key={deposit.id}>
                          <TableCell>{deposit.initiated_by_user_id}</TableCell>
                          <TableCell>₦{deposit.amount.toLocaleString()}</TableCell>
                          <TableCell>{deposit.description}</TableCell>
                          <TableCell>{new Date(deposit.initiated_at).toLocaleString()}</TableCell>
                          {role === "admin" && (
                            <TableCell>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteDeposit(deposit.id)}>
                                Delete
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={role === "admin" ? 5 : 4} className="text-center text-muted-foreground">
                        No deposits recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
