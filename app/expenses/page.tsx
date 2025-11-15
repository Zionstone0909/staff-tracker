"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const getInputValue = (e: React.ChangeEvent<any>): string => (e.currentTarget as any).value

interface Expense {
  id: number
  expense_type: "transportation" | "maintenance" | "fuel" | "repair"
  amount: string
  description: string
  lorry_id: string
  expense_date: string
}

interface User {
  userId: number
  email: string
  role: "admin" | "staff"
  token: string
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newExpense, setNewExpense] = useState<Omit<Expense, "id">>({
    expense_type: "transportation",
    amount: "",
    description: "",
    lorry_id: "",
    expense_date: "",
  })
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const userString = localStorage.getItem("currentUser")
    if (!userString) return router.push("/login")
    const user: User = JSON.parse(userString)
    setCurrentUser(user)
    fetchExpenses(user.token)
  }, [])

  const fetchExpenses = async (token: string) => {
    try {
      const response = await fetch("/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: Expense[] = await response.json()
      setExpenses(data)
    } catch (err) {
      console.error("[v0] Error fetching expenses:", err)
    }
  }

  const handleAddExpense = async () => {
    if (!currentUser) return
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(newExpense),
      })
      if (response.ok) {
        fetchExpenses(currentUser.token)
        setNewExpense({
          expense_type: "transportation",
          amount: "",
          description: "",
          lorry_id: "",
          expense_date: "",
        })
      }
    } catch (err) {
      console.error("[v0] Error adding expense:", err)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!currentUser || currentUser.role !== "admin") return
    if (!confirm(`Are you sure you want to delete expense #${id}?`)) return

    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
      if (response.ok) fetchExpenses(currentUser.token)
    } catch (err) {
      console.error("[v0] Error deleting expense:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4">
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Expenses - Transportation & Maintenance</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record New Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Lorry ID"
                value={newExpense.lorry_id}
                onChange={(e) => setNewExpense({ ...newExpense, lorry_id: getInputValue(e) })}
              />
              <select
                className="border rounded px-3 py-2"
                value={newExpense.expense_type}
                onChange={(e) =>
                  setNewExpense({
                    ...newExpense,
                    expense_type: getInputValue(e) as
                      | "transportation"
                      | "maintenance"
                      | "fuel"
                      | "repair",
                  })
                }
              >
                <option value="transportation">Transportation</option>
                <option value="maintenance">Maintenance</option>
                <option value="fuel">Fuel</option>
                <option value="repair">Repair</option>
              </select>
              <Input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: getInputValue(e) })}
              />
              <Input
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({ ...newExpense, expense_date: getInputValue(e) })}
              />
              <Input
                type="text"
                placeholder="Description"
                className="md:col-span-2"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: getInputValue(e) })}
              />
            </div>
            <Button onClick={handleAddExpense} className="w-full">Add Expense</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lorry ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    {currentUser?.role === "admin" && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{exp.lorry_id}</TableCell>
                        <TableCell>{exp.expense_type}</TableCell>
                        <TableCell>₦{exp.amount}</TableCell>
                        <TableCell>{exp.description}</TableCell>
                        <TableCell>{exp.expense_date}</TableCell>
                        {currentUser?.role === "admin" && (
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteExpense(exp.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={currentUser?.role === "admin" ? 6 : 5} className="text-center text-muted-foreground">
                        No expenses recorded
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
