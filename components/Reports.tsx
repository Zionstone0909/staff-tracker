import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, BackButton, Table, Badge, Button, Input } from './Shared';
import { DollarSign, TrendingUp, TrendingDown, Activity, Calendar, FileText, Download, Filter, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Reports = () => {
  const { sales, expenses, supplierTransactions } = useApp();

  // --- Date Range State ---
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // --- Tab & Search State ---
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'deposits' | 'supplier'>('sales');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Filtering Logic (Date Range for Charts & Totals) ---
  const dateFilteredSales = useMemo(() => {
    return sales.filter(s => {
        const d = s.date.split('T')[0];
        return d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, startDate, endDate]);

  const dateFilteredExpenses = useMemo(() => {
    return expenses.filter(e => {
        const d = e.date;
        return e.type === 'EXPENSE' && d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, startDate, endDate]);

  const dateFilteredDeposits = useMemo(() => {
    return expenses.filter(e => {
        const d = e.date;
        return e.type === 'DEPOSIT' && d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, startDate, endDate]);

  const dateFilteredSupplierTx = useMemo(() => {
    return supplierTransactions.filter(t => {
        const d = t.date.includes('T') ? t.date.split('T')[0] : t.date;
        return d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [supplierTransactions, startDate, endDate]);

  // --- Search Logic (Applied to Date Filtered Data for Tables) ---
  const tableSales = useMemo(() => {
      if (!searchTerm) return dateFilteredSales;
      const lower = searchTerm.toLowerCase();
      return dateFilteredSales.filter(s => 
          s.id.toLowerCase().includes(lower) || 
          (s.customerName || '').toLowerCase().includes(lower) ||
          (s.paymentMethod || '').toLowerCase().includes(lower)
      );
  }, [dateFilteredSales, searchTerm]);

  const tableExpenses = useMemo(() => {
      if (!searchTerm) return dateFilteredExpenses;
      const lower = searchTerm.toLowerCase();
      return dateFilteredExpenses.filter(e => 
          e.description.toLowerCase().includes(lower) || 
          e.category.toLowerCase().includes(lower) ||
          (e.recordedByName || '').toLowerCase().includes(lower)
      );
  }, [dateFilteredExpenses, searchTerm]);

  const tableDeposits = useMemo(() => {
      if (!searchTerm) return dateFilteredDeposits;
      const lower = searchTerm.toLowerCase();
      return dateFilteredDeposits.filter(d => 
          d.description.toLowerCase().includes(lower) || 
          d.paymentMethod.toLowerCase().includes(lower) ||
          (d.recordedByName || '').toLowerCase().includes(lower)
      );
  }, [dateFilteredDeposits, searchTerm]);

  const tableSupplierTx = useMemo(() => {
      if (!searchTerm) return dateFilteredSupplierTx;
      const lower = searchTerm.toLowerCase();
      return dateFilteredSupplierTx.filter(t => 
          t.supplierName.toLowerCase().includes(lower) || 
          t.description.toLowerCase().includes(lower) ||
          t.type.toLowerCase().includes(lower)
      );
  }, [dateFilteredSupplierTx, searchTerm]);

  // --- Aggregate Calculations (Based on Date Range) ---
  const totalSalesRevenue = dateFilteredSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalExpenses = dateFilteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalDeposits = dateFilteredDeposits.reduce((acc, e) => acc + e.amount, 0);
  
  const totalIncome = totalSalesRevenue + totalDeposits;
  const netProfit = totalIncome - totalExpenses;

  // --- Chart Data Preparation (Based on Date Range) ---
  const paymentMethods = useMemo(() => {
    const counts: Record<string, number> = {};
    dateFilteredSales.forEach(s => {
      const method = s.paymentMethod || 'Unknown';
      counts[method] = (counts[method] || 0) + s.total;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dateFilteredSales]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Daily Chart Data
  const dailyData = useMemo(() => {
    const data: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Iterate through each day in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        const daySales = dateFilteredSales
            .filter(s => s.date.startsWith(dateStr))
            .reduce((a, b) => a + b.total, 0);
            
        const dayExpenses = dateFilteredExpenses
            .filter(e => e.date === dateStr)
            .reduce((a, b) => a + b.amount, 0);
        
        data.push({
            date: dateStr,
            name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: daySales,
            expenses: dayExpenses
        });
    }
    return data;
  }, [dateFilteredSales, dateFilteredExpenses, startDate, endDate]);

  const setRange = (days: number) => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
            <p className="text-sm text-gray-500">Overview and detailed history.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-end md:items-center">
             <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-center shrink-0 w-full md:w-auto overflow-x-auto">
                <button onClick={() => setRange(0)} className="flex-1 md:flex-none px-3 py-1 text-xs font-medium hover:bg-white hover:shadow-sm rounded-md transition whitespace-nowrap">Today</button>
                <button onClick={() => setRange(7)} className="flex-1 md:flex-none px-3 py-1 text-xs font-medium hover:bg-white hover:shadow-sm rounded-md transition whitespace-nowrap">7 Days</button>
                <button onClick={() => setRange(30)} className="flex-1 md:flex-none px-3 py-1 text-xs font-medium hover:bg-white hover:shadow-sm rounded-md transition whitespace-nowrap">30 Days</button>
             </div>
             
             <div className="grid grid-cols-2 sm:flex gap-2 items-end w-full md:w-auto">
                <div className="flex flex-col w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 w-full"
                    />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 w-full"
                    />
                </div>
                <Button className="h-[36px] col-span-2 sm:col-auto w-full sm:w-auto flex justify-center" onClick={() => {}}>
                    <Filter className="w-4 h-4" />
                </Button>
             </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
           <span className="text-sm text-gray-500 font-medium">Total Revenue (Sales)</span>
           <div className="flex items-center gap-2 mt-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={totalSalesRevenue.toLocaleString()}>
                ₦{totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
           </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
           <span className="text-sm text-gray-500 font-medium">Total Expenses</span>
           <div className="flex items-center gap-2 mt-2">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown className="w-5 h-5" /></div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={totalExpenses.toLocaleString()}>
                ₦{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
           </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
           <span className="text-sm text-gray-500 font-medium">Extra Deposits</span>
           <div className="flex items-center gap-2 mt-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={totalDeposits.toLocaleString()}>
                ₦{totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
           </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
           <span className="text-sm text-gray-500 font-medium">Net Profit</span>
           <div className="flex items-center gap-2 mt-2">
              <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                  <Activity className="w-5 h-5" />
              </div>
              <span className={`text-xl sm:text-2xl font-bold truncate ${netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`} title={netProfit.toLocaleString()}>
                  ₦{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Overview ({dailyData.length} Days)</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => `₦${val}`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            formatter={(value: number) => [`₦${value.toFixed(2)}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="sales" name="Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </Card>

         <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Payment Method</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={paymentMethods}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {paymentMethods.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `₦${value.toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
         </Card>
      </div>

      {/* Detailed History Tables */}
      <div className="space-y-4">
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-200 pb-1">
             <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                 <button 
                    onClick={() => setActiveTab('sales')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'sales' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                    Sales ({tableSales.length})
                 </button>
                 <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'expenses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                    Expenses ({tableExpenses.length})
                 </button>
                 <button 
                    onClick={() => setActiveTab('deposits')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'deposits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                    Deposits ({tableDeposits.length})
                 </button>
                 <button 
                    onClick={() => setActiveTab('supplier')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'supplier' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                    Supplier ({tableSupplierTx.length})
                 </button>
             </div>
             
             {/* Table Search Bar */}
             <div className="relative w-full lg:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="Search table..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
         </div>

         <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                {activeTab === 'sales' && (
                    <Table headers={['Date', 'Sale ID', 'Customer', 'Items', 'Payment Method', 'Total']}>
                        {tableSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-400 whitespace-nowrap">#{sale.id.slice(-6)}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">{sale.customerName || 'Walk-in'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{sale.items.length} Items</td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                    <Badge color="gray">{sale.paymentMethod || 'Cash'}</Badge>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">₦{sale.total.toFixed(2)}</td>
                            </tr>
                        ))}
                        {tableSales.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No sales found matching your search.</td></tr>
                        )}
                    </Table>
                )}

                {activeTab === 'expenses' && (
                    <Table headers={['Date', 'Category', 'Description', 'Recorded By', 'Status', 'Amount']}>
                        {tableExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{exp.date}</td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                    <Badge color="red">{exp.category}</Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 min-w-[180px]">{exp.description}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{exp.recordedByName || 'System'}</td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                    <Badge color={exp.status === 'Paid' ? 'green' : 'yellow'}>{exp.status}</Badge>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600 whitespace-nowrap">-₦{exp.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                        {tableExpenses.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No expenses found matching your search.</td></tr>
                        )}
                    </Table>
                )}

                {activeTab === 'deposits' && (
                    <Table headers={['Date', 'Source', 'Description', 'Method', 'Recorded By', 'Amount']}>
                        {tableDeposits.map(dep => (
                            <tr key={dep.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{dep.date}</td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                    <Badge color="green">Income</Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 min-w-[180px]">{dep.description}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{dep.paymentMethod}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{dep.recordedByName || 'System'}</td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600 whitespace-nowrap">+₦{dep.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                        {tableDeposits.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No deposits found matching your search.</td></tr>
                        )}
                    </Table>
                )}

                {activeTab === 'supplier' && (
                    <Table headers={['Date', 'Supplier', 'Type', 'Description', 'Amount', 'Initiated By']}>
                        {tableSupplierTx.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">{t.supplierName}</td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                    <Badge color={t.type === 'PAYMENT' ? 'green' : t.type === 'SUPPLY' ? 'blue' : 'yellow'}>
                                        {t.type}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 min-w-[180px]">{t.description}</td>
                                <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${t.type === 'PAYMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                    ₦{t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{t.initiatedByName || 'System'}</td>
                            </tr>
                        ))}
                        {tableSupplierTx.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No supplier transactions found matching your search.</td></tr>
                        )}
                    </Table>
                )}
            </div>
         </Card>
      </div>
    </div>
  );
};