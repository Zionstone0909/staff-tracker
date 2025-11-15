"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ✅ Helper to get input value
const getInputValue = (e: any) => e.currentTarget.value

export default function CompanyExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<any[]>([])
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: "",
    expense_date: "",
    payment_method: "cash",
  })

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    else fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/company-expenses")
      const data = (await response.json()) as any[]
      setExpenses(data)
    } catch (err) {
      console.error("[v0] Error fetching expenses:", err)
    }
  }

  const handleAddExpense = async () => {
    try {
      // Validate fields before sending
      if (!newExpense.description || !newExpense.amount) {
        alert("Description and amount are required")
        return
      }

      const response = await fetch("/api/company-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      })

      if (response.ok) {
        fetchExpenses()
        setNewExpense({
          category: "",
          description: "",
          amount: "",
          expense_date: "",
          payment_method: "cash",
        })
      } else {
        const err = await response.json()
        console.error("[v0] Add expense error:", err)
      }
    } catch (err) {
      console.error("[v0] Error adding expense:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Company Expenses</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record Company Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: getInputValue(e) })}
              />
              <Input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: getInputValue(e) })}
              />
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
              <select
                className="border rounded px-3 py-2"
                value={newExpense.payment_method}
                onChange={(e) => setNewExpense({ ...newExpense, payment_method: getInputValue(e) })}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="check">Check</option>
              </select>
            </div>
            <Button onClick={handleAddExpense} className="w-full">
              Record Expense
            </Button>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length > 0 ? (
                    expenses.map((expense: any) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>₦{expense.amount}</TableCell>
                        <TableCell>{expense.payment_method}</TableCell>
                        <TableCell>{expense.expense_date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
