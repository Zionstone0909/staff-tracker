"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Type definitions
interface PaymentSummary {
  cashTotal: number
  transferTotal: number
}

interface ChartData {
  date: string
  cash: number
  transfer: number
}

export default function PaymentMethodsPage() {
  const router = useRouter()

  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    cashTotal: 0,
    transferTotal: 0,
  })
  const [paymentData, setPaymentData] = useState<ChartData[]>([])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) router.push("/login")
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods")
      const data = (await response.json()) as {
        summary?: PaymentSummary
        chartData?: ChartData[]
      }

      setPaymentSummary(data.summary || { cashTotal: 0, transferTotal: 0 })
      setPaymentData(data.chartData || [])
    } catch (err) {
      console.error("[v0] Error fetching payment methods:", err)
    }
  }

  const COLORS = ["#8884d8", "#82ca9d"]

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Payment Methods Analysis</h1>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ₦{paymentSummary.cashTotal.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer/Moniepoint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ₦{paymentSummary.transferTotal.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Cash", value: paymentSummary.cashTotal },
                      { name: "Transfer", value: paymentSummary.transferTotal },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ₦${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cash" fill="#8884d8" />
                  <Bar dataKey="transfer" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
