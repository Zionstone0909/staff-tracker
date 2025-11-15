// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import ClientWrapper from "@/components/ClientWrapper";

interface UserSession {
  token: string;
  user: {
    id: number;
    email: string;
    role: "admin" | "staff";
  };
}

interface DashboardMetrics {
  totalStaff: number;
  totalSales: number;
  weeklyExpenses: number;
  stockAdjustmentsCount: number;
}

const navLinks = [
  { name: "Bank Deposits", href: "/bank-deposits" },
  { name: "Company Expenses", href: "/company-expenses" },
  { name: "Customer Ledger", href: "/customer-ledger" },
  { name: "Customers", href: "/customers" },
  { name: "Expenses", href: "/expenses" },
  { name: "Inventory", href: "/inventory" },
  { name: "Payment Methods", href: "/payment-methods" },
  { name: "Payroll", href: "/payroll" },
  { name: "Reports", href: "/reports" },
  { name: "Sales", href: "/sales" },
  { name: "Staff Sales", href: "/staff-sales" },
  { name: "Stock Adjustment", href: "/stock-adjustment" },
  { name: "Stock Movement", href: "/stock-movement" },
  { name: "Supplier Ledger", href: "/supplier-ledger" },
  { name: "Suppliers", href: "/suppliers" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const userJson = localStorage.getItem("currentUser");
    if (!userJson) {
      router.replace("/login");
      return;
    }

    let session: UserSession;
    try {
      session = JSON.parse(userJson);
    } catch {
      localStorage.removeItem("currentUser");
      router.replace("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.replace("/login");
      return;
    }

    setUserEmail(session.user.email);
    fetchMetrics(session.token);
  }, [router]);

  const fetchMetrics = async (token: string) => {
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("currentUser");
        router.replace("/login");
        return;
      }

      const data = await res.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("Failed to load dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.replace("/login");
  };

  if (!mounted) return null;

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="font-medium">Welcome, {userEmail}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <p className="text-center mt-10">Loading metrics...</p>
        ) : (
          <div className="flex-1 flex flex-col gap-10">
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="hover:shadow-xl transition-shadow p-4 flex flex-col justify-between bg-white">
                <CardHeader>
                  <CardTitle>Total Staff</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{metrics?.totalStaff ?? 0}</CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow p-4 flex flex-col justify-between bg-white">
                <CardHeader>
                  <CardTitle>Total Sales</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ${metrics?.totalSales?.toLocaleString() ?? 0}
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow p-4 flex flex-col justify-between bg-white">
                <CardHeader>
                  <CardTitle>Weekly Expenses</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ${metrics?.weeklyExpenses?.toLocaleString() ?? 0}
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow p-4 flex flex-col justify-between bg-white">
                <CardHeader>
                  <CardTitle>Stock Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{metrics?.stockAdjustmentsCount ?? 0}</CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <section className="flex-1">
              <h2 className="text-2xl font-semibold mb-6">Navigation Menu</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} passHref>
                    <Card className="hover:shadow-xl hover:border-primary transition-shadow cursor-pointer p-4 flex flex-col justify-between bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">{link.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        View {link.name} details
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </ClientWrapper>
  );
}
