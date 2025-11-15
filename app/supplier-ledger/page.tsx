"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Helper function to safely get the value from the event target using 'any' cast
const getInputValue = (e: React.ChangeEvent<HTMLInputElement>) => (e.currentTarget as any).value;

interface LedgerEntry {
  id?: string
  supplier_id: string
  goods_received: string
  quantity: number 
  amount_owed: number 
  amount_paid: number 
  transaction_date: string
  status: string
}

export default function SupplierLedgerPage() {
  const router = useRouter()
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  
  const [newEntry, setNewEntry] = useState<LedgerEntry>({
    supplier_id: "",
    goods_received: "",
    quantity: 0,
    amount_owed: 0,
    amount_paid: 0,
    transaction_date: "",
    status: "pending",
  })

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchLedger()
  }, [])

  const fetchLedger = async () => {
    try {
      const data = (await (await fetch("/api/supplier-ledger")).json()) as LedgerEntry[]
      setLedger(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddEntry = async () => {
    try {
      await fetch("/api/supplier-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry), 
      })
      fetchLedger()
      setNewEntry({
        supplier_id: "",
        goods_received: "",
        quantity: 0,
        amount_owed: 0,
        amount_paid: 0,
        transaction_date: "",
        status: "pending",
      })
    } catch (err) {
      console.error(err)
    }
  }

  // --- FIXED: Use the helper function `getInputValue(e)` ---
  const handleInput = (field: keyof LedgerEntry) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = getInputValue(e);
      
      const isNumeric = ["quantity", "amount_owed", "amount_paid"].includes(field);
      
      setNewEntry(prev => ({ 
        ...prev, 
        [field]: isNumeric ? (value === "" ? 0 : Number(value)) : value 
      }));
    }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4">
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Supplier Ledger</h1>

        <Card className="mb-8">
          <CardHeader><CardTitle>Record Goods from Supplier</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {(["supplier_id","goods_received","quantity","amount_owed","amount_paid","transaction_date"] as const).map((field) => (
                <Input
                  key={field}
                  type={field.includes("amount") || field === "quantity" ? "number" : field === "transaction_date" ? "date" : "text"}
                  placeholder={field.replace(/_/g, " ").toUpperCase()}
                  value={String(newEntry[field])} 
                  onChange={handleInput(field)}
                />
              ))}
            </div>
            <Button className="w-full" onClick={handleAddEntry}>Record Transaction</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Supplier Transactions</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Supplier ID","Goods Received","Quantity","Amount Owed","Amount Paid","Status","Date"].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.length > 0 ? ledger.map((entry) => (
                    <TableRow key={entry.id || entry.transaction_date}>
                      <TableCell>{entry.supplier_id}</TableCell>
                      <TableCell>{entry.goods_received}</TableCell>
                      <TableCell>{entry.quantity}</TableCell>
                      <TableCell>₦{entry.amount_owed}</TableCell>
                      <TableCell>₦{entry.amount_paid}</TableCell>
                      <TableCell>{entry.status}</TableCell>
                      <TableCell>{entry.transaction_date}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">No transactions recorded</TableCell>
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
