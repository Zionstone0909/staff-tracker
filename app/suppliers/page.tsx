"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ✅ Correct helper to safely get value from input/select events
const getInputValue = (e: React.ChangeEvent<any>): string => {
  return (e.currentTarget as any).value
}


export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  })

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers")
      const data = (await response.json()) as any[] // ✅ Type-safe
      setSuppliers(data)
    } catch (err) {
      console.log("[v0] Error fetching suppliers:", err)
    }
  }

  const handleAddSupplier = async () => {
    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier),
      })
      if (response.ok) {
        fetchSuppliers()
        setNewSupplier({
          name: "",
          contact_person: "",
          phone: "",
          email: "",
          address: "",
        })
      }
    } catch (err) {
      console.log("[v0] Error adding supplier:", err)
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
        <h1 className="text-3xl font-bold mb-6">Suppliers Management</h1>

        {/* Add Supplier Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Supplier Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: getInputValue(e) })}
              />
              <Input
                type="text"
                placeholder="Contact Person"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: getInputValue(e) })}
              />
              <Input
                type="tel"
                placeholder="Phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: getInputValue(e) })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: getInputValue(e) })}
              />
              <Input
                type="text"
                placeholder="Address"
                className="md:col-span-2"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: getInputValue(e) })}
              />
            </div>
            <Button onClick={handleAddSupplier} className="w-full">
              Add Supplier
            </Button>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier: any) => (
                      <TableRow key={supplier.id}>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_person}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.address}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No suppliers added
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
