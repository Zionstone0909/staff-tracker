// src/components/Dashboard.tsx

import React from 'react';
import { useApp } from '../context/AppContext';
import { Card, Badge } from './Shared'; // Assuming these exist
import { ActivityFeed } from './ActivityFeed';
import { 
    DollarSign, 
    Package, 
    ShoppingCart, 
    AlertTriangle, 
    Activity,
    ArrowRight,
    TrendingUp,
    ChevronRight,
    Users as UsersIcon // Renamed to avoid conflict
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Role } from '../types';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
    const { user, sales, products, logs, users } = useApp();
    const isAdmin = user?.role === Role.ADMIN;
    
    // --------------------------------------------------------------------------------
    // Metrics Calculation
    // --------------------------------------------------------------------------------
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const mySales = sales.filter(s => s.initiatedBy === user?.id);
    const myRevenue = mySales.reduce((acc, sale) => acc + sale.total, 0);
    
    // Admin Only: Low stock calculation
    const lowStockProducts = products.filter(p => p.quantity <= (p.minStockLevel || 10)); // Default min to 10 if not set
    
    // Role-based variables
    const revenue = isAdmin ? totalRevenue : myRevenue;
    const totalTransactions = isAdmin ? sales.length : mySales.length;
    const relevantSales = isAdmin ? sales : mySales;

    // --------------------------------------------------------------------------------
    // Chart Data Preparation (Last 7 Days)
    // --------------------------------------------------------------------------------
    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i)); 
        const dateString = date.toISOString().split('T')[0];
        
        const daySales = relevantSales.filter(sale => 
            sale.date.split('T')[0] === dateString
        );

        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: daySales.reduce((acc, sale) => acc + sale.total, 0),
            transactions: daySales.length
        };
    });
    
    // --------------------------------------------------------------------------------
    // Stat Card Component (Local Helper)
    // --------------------------------------------------------------------------------
    const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => {
        const colorStyles = {
            blue: "bg-blue-50 text-blue-600 ring-blue-100",
            green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
            purple: "bg-purple-50 text-purple-600 ring-purple-100",
            red: "bg-red-50 text-red-600 ring-red-100",
            gray: "bg-slate-50 text-slate-600 ring-slate-100",
        };
        const style = colorStyles[color as keyof typeof colorStyles] || colorStyles.gray;
        
        return (
            <div 
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                onClick={onClick}
            >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className={`p-2 sm:p-3.5 rounded-xl ring-1 ${style} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {trend && (
                        <div className="text-[10px] sm:text-xs font-semibold flex items-center bg-green-100 text-green-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{title}</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 truncate">
                    {typeof value === 'number' ? 
                        (title.includes('Revenue') ? `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value.toLocaleString()) : 
                        value
                    }
                </h2>
                <div className="flex justify-between items-center text-xs sm:text-sm text-indigo-600 font-semibold group-hover:text-indigo-800 transition-colors">
                    <span>View Details</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------------
    // Render
    // --------------------------------------------------------------------------------
    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-full">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {isAdmin ? "Admin Dashboard" : "Staff Dashboard"}
            </h1>
            <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8">
                {isAdmin ? "Overview of entire business performance." : "Your personal sales and activities summary."}
            </p>

            {/* Admin-only Alert: Low Stock */}
            {isAdmin && lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl mb-6 md:mb-8 flex items-start sm:items-center shadow-md">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-sm sm:text-base font-semibold flex-grow">
                        LOW STOCK ALERT: {lowStockProducts.length} product(s) below minimum stock level. 
                        <span 
                            className="block sm:inline text-red-600 font-bold sm:ml-2 mt-1 sm:mt-0 cursor-pointer hover:underline"
                            onClick={() => onNavigate('inventory')}
                        >
                            Review Inventory
                        </span>
                    </p>
                </div>
            )}

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <StatCard 
                    title={isAdmin ? "Total Revenue (All Time)" : "My Revenue (All Time)"}
                    value={revenue}
                    icon={DollarSign}
                    color="blue"
                    onClick={() => onNavigate('sales')}
                />
                <StatCard 
                    title={isAdmin ? "Total Transactions" : "My Sales Count"}
                    value={totalTransactions}
                    icon={ShoppingCart}
                    color="green"
                    onClick={() => onNavigate('sales')}
                />
                <StatCard 
                    title="Total Products"
                    value={products.length}
                    icon={Package}
                    color="purple"
                    onClick={() => onNavigate('inventory')}
                />
                {isAdmin && (
                    <StatCard 
                        title="Active Staff"
                        value={users.filter(u => u.isActive && u.role === Role.STAFF).length}
                        icon={UsersIcon}
                        color="red"
                        onClick={() => onNavigate('staff-management')}
                    />
                )}
            </div>

            {/* CHART: Revenue Last 7 Days */}
            <Card title={`Last 7 Days Revenue (${isAdmin ? 'All Sales' : 'My Sales'})`} className="mb-6 md:mb-8">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} />
                            <YAxis 
                                stroke="#64748b" 
                                tickFormatter={(value) => `₦${value}`} 
                                tick={{fontSize: 12}}
                            />
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <Tooltip 
                                formatter={(value: number) => [`₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#4f46e5" 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                name="Revenue"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* REAL-TIME ACTIVITY FEED - Visible to all users (Admin & Staff) */}
            <div className="mb-6 md:mb-8">
                <ActivityFeed maxItems={10} refreshInterval={5000} />
            </div>

            {/* Recent Activity Log - Admin Only */}
            {isAdmin && (
                <Card title="Recent Activity Log" className="mb-6 md:mb-8">
                    <div className="h-64 overflow-y-auto pr-2">
                        <ul className="space-y-3">
                            {logs.slice(0, 10).map((log, index) => (
                                <li key={index} className="flex flex-col sm:flex-row sm:items-start text-sm border-b pb-3 last:border-b-0 gap-2 sm:gap-0">
                                    <div className="flex items-start flex-grow">
                                        <Activity className="w-4 h-4 mt-1 mr-3 text-slate-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-slate-800 break-words">{log.action}</p>
                                            <p className="text-slate-500 break-words">{log.details}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 sm:ml-4 flex-shrink-0 pl-7 sm:pl-0">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div 
                        className="mt-4 pt-4 border-t text-center cursor-pointer text-indigo-600 font-semibold hover:text-indigo-800"
                        onClick={() => onNavigate('reports')}
                    >
                        View All Logs <ArrowRight className="w-4 h-4 inline ml-1" />
                    </div>
                </Card>
            )}

            {/* Quick Actions (Admin Only) */}
            {isAdmin && (
                <div className="mt-6 md:mt-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">Admin Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4">
                        <button 
                            className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto"
                            onClick={() => onNavigate('inventory')} // No need for {action: 'add'} here, just navigate
                        >
                            <Package className="w-5 h-5 mr-2" />
                            Add New Product
                        </button>
                        <button 
                            className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto"
                            onClick={() => onNavigate('sales', { action: 'new' })}
                        >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Process New Sale
                        </button>
                        <button 
                            className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto sm:col-span-2 md:col-span-1"
                            onClick={() => onNavigate('staff-management')}
                        >
                            <UsersIcon className="w-5 h-5 mr-2" />
                            Manage Staff Invitations
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};