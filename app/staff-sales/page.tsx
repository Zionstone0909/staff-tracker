"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface StaffSale {
  id: number
  staff_name: string
  item_name: string
  quantity: number
  total_amount: number
  profit: number
  sale_date: string
}

export default function StaffSalesPage() {
  const router = useRouter()
  const [staffSales, setStaffSales] = useState<StaffSale[]>([])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchStaffSales()
  }, [])

  const fetchStaffSales = async () => {
    try {
      const response = await fetch("/api/staff-sales")
    const data = (await response.json()) as StaffSale[] // ✅ fixed here
      setStaffSales(data)
    } catch (err) {
      console.log("[v0] Error fetching staff sales:", err)
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
        <h1 className="text-3xl font-bold mb-6">Items Sold by Staff</h1>

        <Card>
          <CardHeader>
            <CardTitle>Staff Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffSales.length > 0 ? (
                    staffSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.staff_name}</TableCell>
                        <TableCell>{sale.item_name}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>₦{sale.total_amount}</TableCell>
                        <TableCell>₦{sale.profit}</TableCell>
                        <TableCell>{sale.sale_date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No sales data available
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
