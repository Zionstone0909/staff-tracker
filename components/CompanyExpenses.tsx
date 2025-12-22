import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import ApiClient from '../services/ApiClient';
import {
  Plus, Filter, Download, X, DollarSign, PieChart,
  TrendingUp, Search, Building, ArrowUpRight, ArrowDownLeft, UserCheck
} from 'lucide-react';
import { Expense } from '../types';

export const CompanyExpenses = () => {
  // --- Context & State ---
  const { expenses, suppliers, addExpense } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initialFormState: Partial<Expense> = {
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    category: 'Utilities',
    status: 'Paid',
    paymentMethod: 'Cash',
    amount: 0,
    description: '',
    reference: '',
    supplierId: ''
  };

  const [formData, setFormData] = usePersistentState<Partial<Expense>>('CompanyExpenses.formData', initialFormState);

  // -----------------------
  // Calculated Statistics
  // -----------------------
  const totalExpenses = expenses
    .filter(e => e.type !== 'DEPOSIT')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDeposits = expenses
    .filter(e => e.type === 'DEPOSIT')
    .reduce((sum, item) => sum + item.amount, 0);

  const netBalance = totalDeposits - totalExpenses;

  const categories = [
    'All', 'Utilities', 'Rent', 'Supplies', 'Payroll',
    'Marketing', 'Software', 'Maintenance', 'Inventory/Supply',
    'Supplier Payment', 'Income', 'Deposit'
  ];

  // -----------------------
  // Filtered Expenses for Table (Memoized for performance)
  // -----------------------
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const matchesSearch =
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (expense.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, categoryFilter]);

  // -----------------------
  // Handle Form Submit
  // -----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic Validation
    if (!formData.amount || !formData.description) {
      setErrorMessage('Amount and Description are required.');
      return;
    }

    if (formData.amount <= 0) {
      setErrorMessage('Amount must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      // 1. API Call to Save Expense/Deposit
      const savedExpense: Expense = await ApiClient.post('/api/expenses', formData);

      // 2. Update Local State (History)
      // The instruction was to ensure history is working, which this line does by calling 'addExpense'
      addExpense(savedExpense); 

      // 3. Reset UI
      setFormData(initialFormState);
      setShowForm(false);
    } catch (err: any) {
      console.error('Error saving financial record:', err);
      setErrorMessage('Failed to save record. Please check the network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // Export CSV
  // -----------------------
  const exportData = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Method', 'Reference', 'Status', 'RecordedBy'],
      ...expenses.map(e => [
        e.date,
        e.type,
        e.category,
        e.description.replace(/"/g, '""'), // Handle quotes in description
        e.amount,
        e.paymentMethod,
        e.reference || '',
        e.status,
        e.recordedByName || ''
      ])
    ]
      .map(row => row.map(item => typeof item === 'string' ? `"${item}"` : item).join(',')) // Enclose string items in quotes
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "financial_records.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6 lg:px-8">
      <BackButton />

      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📊 Financial Records</h1>
            <p className="text-gray-500 text-sm">Track expenses, deposits, and net cash flow.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={exportData}
              variant="secondary"
              className="flex-1 md:flex-none justify-center"
            >
              <Download className="w-4 h-4" />{' '}
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>

            <Button
              onClick={() => { setShowForm(!showForm); setFormData(initialFormState); setErrorMessage(''); }}
              variant={showForm ? 'secondary' : 'danger'}
              className="flex-1 md:flex-none justify-center"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Record Expense'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-50 rounded-full shrink-0">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium truncate">Total Expenses</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                ₦{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-green-500">
            <div className="p-3 bg-green-50 rounded-full shrink-0">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium truncate">Total Deposits</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                ₦{totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-50 rounded-full shrink-0">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium truncate">Net Balance</p>
              <h3 className={`text-xl sm:text-2xl font-bold truncate ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₦{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>
        </div>
      </div>
      

      {/* Form Section */}
      {showForm && (
        <Card className="p-4 sm:p-6 bg-red-50 border-red-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-gray-800 mb-4 border-b border-red-200 pb-2">
            New Expense Record
          </h3>
          {errorMessage && (
            <p className="text-red-600 font-medium mb-2">{errorMessage}</p>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.filter(c => c !== 'All' && c !== 'Deposit' && c !== 'Income')
                .map(c => <option key={c} value={c}>{c}</option>)}
            </Select>

            <Input
              label="Amount (₦)"
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />

            <Input
              label="Description"
              placeholder="e.g. Internet Bill"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <Input
              label="Reference / Receipt #"
              placeholder="Optional"
              value={formData.reference || ''}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
            />

            <Select
              label="Link to Supplier (Optional)"
              value={formData.supplierId}
              onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
            >
              <option value="">-- None --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>

            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
            </Select>

            <Select
              label="Status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </Select>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); setErrorMessage(''); }}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={loading}>
                {loading ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Table Content */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search description or reference..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-gray-200">
            <Filter className="w-4 h-4 text-gray-500 shrink-0" />
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table headers={['Date', 'Type', 'Category', 'Description', 'Ref #', 'Amount', 'Method', 'Supplier', 'Status', 'Recorded By']}>
            {filteredExpenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.date}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {expense.type === 'DEPOSIT' ? (
                    <Badge color="green"><span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Deposit</span></Badge>
                  ) : (
                    <Badge color="red"><span className="flex items-center gap-1"><ArrowDownLeft className="w-3 h-3" /> Expense</span></Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium min-w-[180px]">{expense.description}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs whitespace-nowrap">{expense.reference || '-'}</td>
                <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${expense.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {expense.type === 'DEPOSIT' ? '+' : '-'}₦{expense.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.paymentMethod}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {expense.supplierId ? (
                    <span className="flex items-center gap-1 text-xs text-brand-600 font-medium bg-brand-50 px-2 py-1 rounded-full">
                      <Building className="w-3 h-3" />
                      {suppliers.find(s => s.id === expense.supplierId)?.name || 'Linked'}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color={expense.status === 'Paid' ? 'green' : 'yellow'}>{expense.status}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 text-gray-400" />
                    <span>{expense.recordedByName || 'System'}</span>
                  </div>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <p>No financial records found matching your criteria.</p>
                </td>
              </tr>
            )}
          </Table>
        </div>
        
      </Card>
    </div>
  );
};