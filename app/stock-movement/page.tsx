"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ✅ Type-safe helper function
const getInputValue = (e: React.ChangeEvent<any>): string => {
  return (e.currentTarget as any).value
}


export default function StockMovementPage() {
  const router = useRouter()
  const [movements, setMovements] = useState<any[]>([])
  const [newMovement, setNewMovement] = useState({
    inventory_id: "",
    movement_type: "stock_in",
    quantity: "",
    opening_stock: "",
    closing_stock: "",
    movement_date: "",
    reference_id: "",
  })

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      const response = await fetch("/api/stock-movement")
      const data = (await response.json()) as any[] // ✅ prevent “unknown” type error
      setMovements(data)
    } catch (err) {
      console.log("[v0] Error fetching movements:", err)
    }
  }

  const handleAddMovement = async () => {
    try {
      const response = await fetch("/api/stock-movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovement),
      })
      if (response.ok) {
        fetchMovements()
        setNewMovement({
          inventory_id: "",
          movement_type: "stock_in",
          quantity: "",
          opening_stock: "",
          closing_stock: "",
          movement_date: "",
          reference_id: "",
        })
      }
    } catch (err) {
      console.log("[v0] Error adding movement:", err)
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
        <h1 className="text-3xl font-bold mb-6">Stock Movement</h1>

        {/* ===== Record Form ===== */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record Stock Movement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Inventory ID"
                value={newMovement.inventory_id}
                onChange={(e) => setNewMovement({ ...newMovement, inventory_id: getInputValue(e) })}
              />
              <select
                className="border rounded px-3 py-2"
                value={newMovement.movement_type}
                onChange={(e) => setNewMovement({ ...newMovement, movement_type: getInputValue(e) })}
              >
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="opening">Opening Stock</option>
                <option value="closing">Closing Stock</option>
              </select>
              <Input
                type="number"
                placeholder="Quantity"
                value={newMovement.quantity}
                onChange={(e) => setNewMovement({ ...newMovement, quantity: getInputValue(e) })}
              />
              <Input
                type="number"
                placeholder="Opening Stock"
                value={newMovement.opening_stock}
                onChange={(e) => setNewMovement({ ...newMovement, opening_stock: getInputValue(e) })}
              />
              <Input
                type="number"
                placeholder="Closing Stock"
                value={newMovement.closing_stock}
                onChange={(e) => setNewMovement({ ...newMovement, closing_stock: getInputValue(e) })}
              />
              <Input
                type="date"
                value={newMovement.movement_date}
                onChange={(e) => setNewMovement({ ...newMovement, movement_date: getInputValue(e) })}
              />
              <Input
                type="text"
                placeholder="Reference ID"
                value={newMovement.reference_id}
                onChange={(e) => setNewMovement({ ...newMovement, reference_id: getInputValue(e) })}
              />
            </div>
            <Button onClick={handleAddMovement} className="w-full">
              Record Movement
            </Button>
          </CardContent>
        </Card>

        {/* ===== Records Table ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Opening</TableHead>
                    <TableHead>Closing</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length > 0 ? (
                    movements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>{movement.inventory_id}</TableCell>
                        <TableCell>{movement.movement_type}</TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.opening_stock}</TableCell>
                        <TableCell>{movement.closing_stock}</TableCell>
                        <TableCell>{movement.movement_date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No movements recorded
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
