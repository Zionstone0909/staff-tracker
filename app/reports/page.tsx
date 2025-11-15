"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useReactToPrint } from "react-to-print"

export default function ReportsPage() {
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null) // Ref for printing

  const [reportData, setReportData] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalPayroll: 0,
  })

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports")
      const data = (await response.json()) as {
        chartData: any[]
        summary: typeof summary
      }
      setReportData(data.chartData || [])
      setSummary(data.summary || {})
    } catch (err) {
      console.log("[v0] Error fetching reports:", err)
    }
  }

  // ✅ react-to-print setup
  const handlePrint = useReactToPrint({
    content: () => reportRef.current!, // cast handled by ref
  } as any)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <Button onClick={handlePrint}>Print/PDF</Button>
      </nav>

      <main ref={reportRef} className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Financial Reports</h1>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₦{summary.totalSales?.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₦{summary.totalExpenses?.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                ₦{summary.totalProfit?.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₦{summary.totalPayroll?.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                <Line type="monotone" dataKey="expenses" stroke="#82ca9d" />
                <Line type="monotone" dataKey="profit" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
