"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function StockAdjustmentPage() {
  const router = useRouter()
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [newAdjustment, setNewAdjustment] = useState({
    inventory_id: "",
    adjustment_type: "received",
    quantity: "",
    reason: "",
    adjustment_date: "",
  })

  const getInputValue = (e: React.ChangeEvent<any>): string => {
  return (e.currentTarget as any).value
}


  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchAdjustments()
  }, [])

  const fetchAdjustments = async () => {
    try {
      const response = await fetch("/api/stock-adjustment")
      const data = (await response.json()) as any[] // ✅ Explicit type cast
      setAdjustments(data)
    } catch (err) {
      console.log("[v0] Error fetching adjustments:", err)
    }
  }

  const handleAddAdjustment = async () => {
    try {
      const response = await fetch("/api/stock-adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdjustment),
      })
      if (response.ok) {
        fetchAdjustments()
        setNewAdjustment({
          inventory_id: "",
          adjustment_type: "received",
          quantity: "",
          reason: "",
          adjustment_date: "",
        })
      }
    } catch (err) {
      console.log("[v0] Error adding adjustment:", err)
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
        <h1 className="text-3xl font-bold mb-6">Stock Adjustments</h1>

        {/* ===== Record Form ===== */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record Stock Adjustment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Inventory ID"
                value={newAdjustment.inventory_id}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, inventory_id: getInputValue(e) })}
              />
              <select
                className="border rounded px-3 py-2"
                value={newAdjustment.adjustment_type}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_type: getInputValue(e) })}
              >
                <option value="received">Goods Received</option>
                <option value="sold">Sold</option>
                <option value="damaged">Damaged</option>
                <option value="canceled">Canceled Sale</option>
              </select>
              <Input
                type="number"
                placeholder="Quantity"
                value={newAdjustment.quantity}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, quantity: getInputValue(e) })}
              />
              <Input
                type="date"
                value={newAdjustment.adjustment_date}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_date: getInputValue(e) })}
              />
              <Input
                type="text"
                placeholder="Reason"
                className="md:col-span-2"
                value={newAdjustment.reason}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: getInputValue(e) })}
              />
            </div>
            <Button onClick={handleAddAdjustment} className="w-full">
              Record Adjustment
            </Button>
          </CardContent>
        </Card>

        {/* ===== Records Table ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.length > 0 ? (
                    adjustments.map((adj: any) => (
                      <TableRow key={adj.id}>
                        <TableCell>{adj.inventory_id}</TableCell>
                        <TableCell>{adj.adjustment_type}</TableCell>
                        <TableCell>{adj.quantity}</TableCell>
                        <TableCell>{adj.reason}</TableCell>
                        <TableCell>{adj.adjustment_date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No adjustments recorded
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
