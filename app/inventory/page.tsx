"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ------------------- TYPES -------------------
interface InventoryItem {
  id: number
  item_name: string
  quantity: number
  unit_price: number
  total_value: number
  reorder_level: number
}

interface CurrentUser {
  userId: number
  email: string
  role: "admin" | "staff"
}

// ------------------- COMPONENT -------------------
export default function InventoryPage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [newItem, setNewItem] = useState<Omit<InventoryItem, "id" | "total_value">>({
    item_name: "",
    quantity: 0,
    unit_price: 0,
    reorder_level: 0,
  })

  // Fetch user & inventory
  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) return router.push("/login")
    setCurrentUser(JSON.parse(user))
    fetchInventory()
  }, [])

  const handleInput = (field: keyof typeof newItem) => (e: any) => {
    const value = field === "item_name" ? e.currentTarget.value : parseFloat(e.currentTarget.value)
    setNewItem(prev => ({ ...prev, [field]: value }))
  }

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      const data: InventoryItem[] = await res.json()
      setInventory(data)
      const total = data.reduce((sum, item) => sum + item.total_value, 0)
      setTotalValue(total)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddItem = async () => {
    try {
      const payload: Omit<InventoryItem, "id" | "total_value"> = { ...newItem }

      // Staff cannot add negative quantity
      if (currentUser?.role === "staff" && payload.quantity < 0) {
        alert("Staff cannot add negative quantity")
        return
      }

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to add inventory item")
      fetchInventory()
      setNewItem({ item_name: "", quantity: 0, unit_price: 0, reorder_level: 0 })
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateItem = async (item: InventoryItem) => {
    try {
      const payload: Partial<InventoryItem> = {
        id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
      }

      if (currentUser?.role === "admin") {
        payload.unit_price = item.unit_price
        payload.reorder_level = item.reorder_level
      }

      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to update inventory item")
      fetchInventory()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete item")
      fetchInventory()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <nav className="border-b bg-card p-4 mb-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <div>Total Inventory Value: ${totalValue.toFixed(2)}</div>
      </nav>

      {/* Add Item Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Inventory Item</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Input
            placeholder="Item Name"
            value={newItem.item_name}
            onChange={handleInput("item_name")}
          />
          <Input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={handleInput("quantity")}
          />
          {currentUser?.role === "admin" && (
            <>
              <Input
                type="number"
                placeholder="Unit Price"
                value={newItem.unit_price}
                onChange={handleInput("unit_price")}
              />
              <Input
                type="number"
                placeholder="Reorder Level"
                value={newItem.reorder_level}
                onChange={handleInput("reorder_level")}
              />
            </>
          )}
          <Button onClick={handleAddItem}>Add Item</Button>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Reorder Level</TableHead>
            {currentUser?.role === "admin" && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  value={item.item_name}
                  onChange={e =>
                    setInventory(prev =>
                      prev.map(i =>
                        i.id === item.id ? { ...i, item_name: e.currentTarget.value } : i
                      )
                    )
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={e =>
                    setInventory(prev =>
                      prev.map(i =>
                        i.id === item.id
                          ? { ...i, quantity: parseFloat(e.currentTarget.value) }
                          : i
                      )
                    )
                  }
                />
              </TableCell>
              <TableCell>
                {currentUser?.role === "admin" ? (
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={e =>
                      setInventory(prev =>
                        prev.map(i =>
                          i.id === item.id
                            ? { ...i, unit_price: parseFloat(e.currentTarget.value) }
                            : i
                        )
                      )
                    }
                  />
                ) : (
                  item.unit_price
                )}
              </TableCell>
              <TableCell>{(item.quantity * item.unit_price).toFixed(2)}</TableCell>
              <TableCell>
                {currentUser?.role === "admin" ? (
                  <Input
                    type="number"
                    value={item.reorder_level}
                    onChange={e =>
                      setInventory(prev =>
                        prev.map(i =>
                          i.id === item.id
                            ? { ...i, reorder_level: parseFloat(e.currentTarget.value) }
                            : i
                        )
                      )
                    }
                  />
                ) : (
                  item.reorder_level
                )}
              </TableCell>
              {currentUser?.role === "admin" && (
                <TableCell className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdateItem(item)}>
                    Update
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
