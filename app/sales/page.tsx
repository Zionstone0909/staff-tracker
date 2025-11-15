"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useReactToPrint } from "react-to-print"

interface Sale {
  id: number
  customer_name: string
  total_amount: string
  paid_amount: string
  payment_status: string
  payment_method: string
}

export default function SalesPage() {
  const router = useRouter()
  const receiptRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const [sales, setSales] = useState<Sale[]>([])
  const [user, setUser] = useState<any>(null)
  const [newSale, setNewSale] = useState({
    customer_name: "",
    total_amount: "",
    paid_amount: "",
    payment_status: "outstanding",
    payment_method: "cash",
  })

  // ✅ helper to safely get input values
const getInputValue = (e: React.ChangeEvent<any>): string => {
  return (e.currentTarget as any).value
}

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales")
      const data = (await response.json()) as Sale[]
      setSales(data)
    } catch (err) {
      console.log("[v0] Error fetching sales:", err)
    }
  }

  const handleAddSale = async () => {
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSale,
          staff_id: user?.id,
          profit:
            Number.parseFloat(newSale.total_amount) - Number.parseFloat(newSale.paid_amount),
        }),
      })
      if (response.ok) {
        fetchSales()
        setNewSale({
          customer_name: "",
          total_amount: "",
          paid_amount: "",
          payment_status: "outstanding",
          payment_method: "cash",
        })
      }
    } catch (err) {
      console.log("[v0] Error adding sale:", err)
    }
  }

  const handlePrint = (id: number) => {
    const ref = receiptRefs.current.get(id)
    if (!ref) return
    const printFunc = useReactToPrint({
      content: () => ref,
    } as any)
    printFunc?.()
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Sales & POS</h1>

        {/* New Sale Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record New Sale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Customer Name"
                value={newSale.customer_name}
                onChange={(e) => setNewSale({ ...newSale, customer_name: getInputValue(e) })}
              />
              <Input
                type="number"
                placeholder="Total Amount"
                value={newSale.total_amount}
                onChange={(e) => setNewSale({ ...newSale, total_amount: getInputValue(e) })}
              />
              <Input
                type="number"
                placeholder="Amount Paid"
                value={newSale.paid_amount}
                onChange={(e) => setNewSale({ ...newSale, paid_amount: getInputValue(e) })}
              />
              <select
                className="border rounded px-3 py-2"
                value={newSale.payment_method}
                onChange={(e) => setNewSale({ ...newSale, payment_method: getInputValue(e) })}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="check">Check</option>
              </select>
            </div>
            <Button onClick={handleAddSale} className="w-full">
              Record Sale
            </Button>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length > 0 ? (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>₦{sale.total_amount}</TableCell>
                        <TableCell>₦{sale.paid_amount}</TableCell>
                        <TableCell>{sale.payment_status}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrint(sale.id)}
                          >
                            Receipt
                          </Button>

                          {/* Hidden receipt for printing */}
                          <div
                            ref={(el) => {
                              if (el) receiptRefs.current.set(sale.id, el)
                            }}
                            style={{ display: "none" }}
                          >
                            <h2>Receipt</h2>
                            <p>Date: {new Date().toLocaleDateString()}</p>
                            <p>Customer: {sale.customer_name}</p>
                            <p>Total: ₦{sale.total_amount}</p>
                            <p>Paid: ₦{sale.paid_amount}</p>
                            <p>Status: {sale.payment_status}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No sales recorded
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
