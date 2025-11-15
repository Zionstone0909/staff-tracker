"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const getInputValue = (e: React.ChangeEvent<any>): string => (e.currentTarget as any).value

interface LedgerEntry {
  id: number
  customer_id: string
  description: string
  amount: string
  transaction_date: string
  transaction_type: "sale" | "payment" | "return"
  status: "outstanding" | "completed"
}

export default function CustomerLedgerPage() {
  const router = useRouter()
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [newEntry, setNewEntry] = useState<Omit<LedgerEntry, "id">>({
    customer_id: "",
    description: "",
    amount: "",
    transaction_date: "",
    transaction_type: "sale",
    status: "outstanding",
  })
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    const storedToken = localStorage.getItem("jwtToken")
    if (!storedUser || !storedToken) {
      router.push("/login")
      return
    }
    setToken(storedToken)
    fetchLedger(storedToken)
  }, [])

  const fetchLedger = async (authToken: string) => {
    try {
      const response = await fetch("/api/customer-ledger", {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.status === 401) {
        router.push("/login")
        return
      }

      const data = (await response.json()) as LedgerEntry[]
      setLedger(data)
    } catch (err) {
      console.error("[v0] Error fetching ledger:", err)
    }
  }

  const handleAddEntry = async () => {
    if (!token) return
    try {
      const response = await fetch("/api/customer-ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEntry),
      })

      if (response.ok) {
        fetchLedger(token)
        setNewEntry({
          customer_id: "",
          description: "",
          amount: "",
          transaction_date: "",
          transaction_type: "sale",
          status: "outstanding",
        })
      } else if (response.status === 401) {
        router.push("/login")
      }
    } catch (err) {
      console.error("[v0] Error adding entry:", err)
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
        <h1 className="text-3xl font-bold mb-6">Customer Ledger</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record Customer Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Customer ID"
                value={newEntry.customer_id}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, customer_id: getInputValue(e) })
                }
              />
              <Input
                type="text"
                placeholder="Description"
                value={newEntry.description}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, description: getInputValue(e) })
                }
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newEntry.amount}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, amount: getInputValue(e) })
                }
              />
              <Input
                type="date"
                value={newEntry.transaction_date}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, transaction_date: getInputValue(e) })
                }
              />
              <select
                className="border rounded px-3 py-2"
                value={newEntry.transaction_type}
                onChange={(e) =>
                  setNewEntry({
                    ...newEntry,
                    transaction_type: getInputValue(e) as
                      | "sale"
                      | "payment"
                      | "return",
                  })
                }
              >
                <option value="sale">Sale</option>
                <option value="payment">Payment</option>
                <option value="return">Return</option>
              </select>
              <select
                className="border rounded px-3 py-2"
                value={newEntry.status}
                onChange={(e) =>
                  setNewEntry({
                    ...newEntry,
                    status: getInputValue(e) as "outstanding" | "completed",
                  })
                }
              >
                <option value="outstanding">Outstanding</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <Button onClick={handleAddEntry} className="w-full">
              Record Transaction
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.length > 0 ? (
                    ledger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.customer_id}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>₦{entry.amount}</TableCell>
                        <TableCell>{entry.transaction_type}</TableCell>
                        <TableCell>{entry.status}</TableCell>
                        <TableCell>{entry.transaction_date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No transactions recorded
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
