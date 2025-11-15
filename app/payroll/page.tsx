"use client"

import { useState, useEffect, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert" 

interface PayrollRecord {
  id: number
  staff_id: string
  month: string
  salary_amount: string
  payment_date: string
  payment_method: string
  status: 'paid' | 'unpaid' | 'pending'
}

export default function PayrollPage() {
  const router = useRouter()
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [newPayroll, setNewPayroll] = useState<Omit<PayrollRecord, 'id' | 'status'>>({
    staff_id: "",
    month: "",
    salary_amount: "",
    payment_date: "",
    payment_method: "bank_transfer",
  })
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const user = localStorage.getItem("currentUser")
    if (!user) {
      console.log("No user found, redirecting to login.")
      router.push("/login")
    }
    fetchPayroll()
  }, [])

  // ✅ Using 'any' to bypass TS value errors
  const handleInput = (field: keyof typeof newPayroll) => (e: any) => {
    const value = e.currentTarget.value
    setNewPayroll(prevForm => ({ ...prevForm, [field]: value }))
  }

  const fetchPayroll = async () => {
    try {
      const response = await fetch("/api/payroll")
      if (!response.ok) throw new Error("Failed to fetch payroll data")
      const data = await response.json() as PayrollRecord[]
      setPayroll(data)
    } catch (err) {
      console.error("[v0] Error fetching payroll:", err)
      setError("Failed to load payroll records.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayroll = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!newPayroll.staff_id || !newPayroll.month || !newPayroll.salary_amount || !newPayroll.payment_date) {
         setError("Please fill in all required fields.")
         setLoading(false)
         return
      }

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPayroll, salary_amount: parseFloat(newPayroll.salary_amount) }),
      })
      if (response.ok) {
        fetchPayroll()
        setNewPayroll({
          staff_id: "",
          month: "",
          salary_amount: "",
          payment_date: "",
          payment_method: "bank_transfer",
        })
      } else {
        throw new Error("Failed to add payroll record.")
      }
    } catch (err) {
      console.error("[v0] Error adding payroll:", err)
      setError("Error recording payroll. Please try again.")
    } finally {
        setLoading(false)
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
        <h1 className="text-3xl font-bold mb-6">Payroll Management</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record New Salary Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddPayroll} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Staff ID"
                  value={newPayroll.staff_id}
                  onChange={handleInput("staff_id")}
                />
                <Input
                  type="month"
                  placeholder="Month"
                  value={newPayroll.month}
                  onChange={handleInput("month")}
                />
                <Input
                  type="number"
                  placeholder="Salary Amount"
                  value={newPayroll.salary_amount}
                  onChange={handleInput("salary_amount")}
                />
                <Input
                  type="date"
                  value={newPayroll.payment_date}
                  onChange={handleInput("payment_date")}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Payroll Record"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.length > 0 ? (
                    payroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.staff_id}</TableCell>
                        <TableCell>{record.month}</TableCell>
                        <TableCell>₦{parseFloat(record.salary_amount).toLocaleString()}</TableCell>
                        <TableCell>{record.payment_date}</TableCell>
                        <TableCell>{record.status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No payroll records
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
