import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import { Search, Check, Building, ArrowUpRight, ArrowDownLeft, LayoutList, PlusCircle, Package, FileText, DollarSign, Loader2, X } from 'lucide-react';
import { Supplier, Role } from '../types';

export const SupplierLedger = ({ onBack }: { onBack: () => void }) => {
  const { suppliers, products, supplierTransactions, receiveStock, addSupplierPayment, addExpense, user } = useApp();
    const [selectedSupplier, setSelectedSupplier] = usePersistentState<Supplier | null>('SupplierLedger.selectedSupplier', null);
  const isAdmin = user?.role === Role.ADMIN;
  
  // Tab State
    const [activeTab, setActiveTab] = usePersistentState<'history' | 'transaction'>('SupplierLedger.activeTab', 'history');
    const [txType, setTxType] = usePersistentState<'STOCK' | 'EXPENSE' | 'PAYMENT'>('SupplierLedger.txType', 'STOCK');

  // Search State
    const [searchTerm, setSearchTerm] = usePersistentState('SupplierLedger.searchTerm', '');
    const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // -- Filter State --
    const [startDate, setStartDate] = usePersistentState('SupplierLedger.startDate', (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    })());
    const [endDate, setEndDate] = usePersistentState('SupplierLedger.endDate', (() => new Date().toISOString().split('T')[0])());
    const [tableSearch, setTableSearch] = usePersistentState('SupplierLedger.tableSearch', '');
  
  // Form States
    const [stockItem, setStockItem] = usePersistentState('SupplierLedger.stockItem', { productId: '', quantity: '', cost: '' });
    const [paymentData, setPaymentData] = usePersistentState('SupplierLedger.paymentData', { amount: '', method: 'Bank Transfer', reference: '' });
    const [expenseData, setExpenseData] = usePersistentState('SupplierLedger.expenseData', { description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Strict Admin Access ---
  if (!isAdmin) {
      return (
        <div className="space-y-6">
            <BackButton onClick={onBack} />
            <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-red-200 bg-red-50">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-900">Access Restricted</h3>
                <p className="text-red-600 max-w-sm mt-1">This page is restricted to administrators only.</p>
            </Card>
        </div>
      );
  }

  const filteredDropdown = searchTerm ? suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : suppliers;

  const allTransactions = useMemo(() => {
      if (!selectedSupplier) return [];
      return supplierTransactions.filter(t => t.supplierId === selectedSupplier.id);
  }, [supplierTransactions, selectedSupplier]);

  const stats = useMemo(() => {
    if (!selectedSupplier) return { debit: 0, credit: 0 };
    let debit = 0; // Owed to supplier
    let credit = 0; // Paid to supplier
    allTransactions.forEach(t => {
        if (t.type === 'SUPPLY' || t.type === 'EXPENSE') {
            debit += t.amount;
        } else if (t.type === 'PAYMENT') {
            credit += t.amount;
        }
    });
    return { debit, credit };
  }, [allTransactions, selectedSupplier]);

  const filteredTransactions = useMemo(() => {
     let data = allTransactions;

     // Date Filter
     data = data.filter(t => {
        const d = t.date.includes('T') ? t.date.split('T')[0] : t.date;
        return d >= startDate && d <= endDate;
     });

     // Text Filter
     if (tableSearch) {
        const lower = tableSearch.toLowerCase();
        data = data.filter(t => 
            t.description.toLowerCase().includes(lower) || 
            t.type.toLowerCase().includes(lower) ||
            (t.reference || '').toLowerCase().includes(lower)
        );
     }

     return data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, startDate, endDate, tableSearch]);

  const balance = useMemo(() => {
      return stats.debit - stats.credit;
  }, [stats]);

  const handleTransactionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSupplier) return;
      
      const currentTxType = txType;
      
      // Validation and Data Capture
      let promise;
      
      if (currentTxType === 'STOCK') {
          if (!stockItem.productId || !stockItem.quantity || stockItem.cost === '') {
              alert('Please fill all stock fields.');
              return;
          }
          const payload = [{ 
              productId: stockItem.productId, 
              quantity: parseFloat(stockItem.quantity), 
              cost: parseFloat(stockItem.cost) 
          }];
          promise = receiveStock(selectedSupplier.id, payload);
      } else if (currentTxType === 'EXPENSE') {
          if (!expenseData.amount || !expenseData.description) {
               alert('Please fill all expense fields.');
               return;
          }
          promise = addExpense({
              type: 'EXPENSE',
              supplierId: selectedSupplier.id,
              date: expenseData.date,
              amount: Number(expenseData.amount),
              description: expenseData.description,
              category: 'Supplier Expense',
              paymentMethod: 'N/A', 
              status: 'Pending',
              reference: 'EXP-' + Date.now().toString().slice(-6)
          });
      } else if (currentTxType === 'PAYMENT') {
          if (!paymentData.amount) {
              alert('Please enter an amount.');
              return;
          }
          promise = addSupplierPayment({
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.name,
              date: new Date().toISOString().split('T')[0],
              amount: Number(paymentData.amount),
              reference: paymentData.reference,
              description: `Payment via ${paymentData.method}`,
              paymentMethod: paymentData.method
          });
      } else {
          return;
      }

      // Optimistic Updates
      setActiveTab('history');
      setStockItem({ productId: '', quantity: '', cost: '' });
      setPaymentData({ amount: '', method: 'Bank Transfer', reference: '' });
      setExpenseData({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      
      alert('Transaction submitted successfully.');
      
      // Background Execution
      setIsSubmitting(true);
      promise
        .catch((err: any) => {
             console.error("Transaction failed in background:", err);
             alert(`Background Error: Failed to process transaction. ${err.message}`);
        })
        .finally(() => {
             setIsSubmitting(false);
        });
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Supplier Ledger</h1>
      <Card>
          <div className="p-4 sm:p-6 border-b flex flex-col md:flex-row gap-4 items-end bg-gray-50 rounded-t-lg">
              <div className="flex-1 w-full relative" ref={searchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
                  <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Type to search supplier..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setIsFocused(true); }}
                        onFocus={() => setIsFocused(true)}
                      />
                      {isFocused && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                            {filteredDropdown.map(s => (
                                <div 
                                    key={s.id} 
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                    onClick={() => {
                                        setSelectedSupplier(s);
                                        setSearchTerm(s.name);
                                        setIsFocused(false);
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900">{s.name}</span>
                                        {selectedSupplier?.id === s.id && <Check className="w-4 h-4 text-green-600" />}
                                    </div>
                                    <p className="text-xs text-gray-500">{s.contactPerson} • {s.email}</p>
                                </div>
                            ))}
                            {filteredDropdown.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500">No suppliers found.</div>
                            )}
                        </div>
                      )}
                  </div>
              </div>
          </div>

          {selectedSupplier ? (
             <div className="overflow-hidden">
                {/* Supplier Summary Card */}
                <div className="p-4 sm:p-6 bg-white border-b border-gray-100">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-50 flex items-center justify-center text-xl sm:text-2xl font-bold text-blue-600 border border-blue-100 shrink-0">
                                {selectedSupplier.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{selectedSupplier.name}</h2>
                                <div className="flex flex-col text-xs sm:text-sm text-gray-500">
                                    <span className="truncate">{selectedSupplier.contactPerson}</span>
                                    <span>{selectedSupplier.phone}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Debit (Owed)</span>
                                <span className="text-lg sm:text-xl font-bold text-red-600 flex items-center gap-1">
                                    <ArrowUpRight className="w-4 h-4" /> ₦{stats.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Credit (Paid)</span>
                                <span className="text-lg sm:text-xl font-bold text-green-600 flex items-center gap-1">
                                    <ArrowDownLeft className="w-4 h-4" /> ₦{stats.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col col-span-2 lg:col-span-1">
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding Balance</span>
                                <span className={`text-xl sm:text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-400">
                                    {balance > 0 ? 'You owe supplier' : 'Account settled'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1">
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutList className="w-4 h-4" /> Ledger History
                    </button>
                    <button 
                        onClick={() => setActiveTab('transaction')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'transaction' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <PlusCircle className="w-4 h-4" /> New Transaction
                    </button>
                </div>

                {activeTab === 'history' ? (
                    <div>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full lg:w-auto">
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
                                        <input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="border rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
                                        <input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="border rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="relative w-full lg:w-64">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input 
                                    placeholder="Search description, type or ref..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500"
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table headers={['Date', 'Type', 'Description', 'Debit (Paid)', 'Credit (Owed)', 'Details', 'Initiated By']}>
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <Badge color={t.type === 'PAYMENT' ? 'green' : t.type === 'SUPPLY' ? 'blue' : 'yellow'}>
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 min-w-[200px]">{t.description}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-green-600 whitespace-nowrap">
                                            {t.type === 'PAYMENT' ? `₦${t.amount.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-600 whitespace-nowrap">
                                            {t.type !== 'PAYMENT' ? `₦${t.amount.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 min-w-[150px]">
                                            {t.items ? (
                                                <div className="text-xs">
                                                    {t.items.map((i, idx) => (
                                                        <div key={idx}>{i.quantity}x {i.productName}</div>
                                                    ))}
                                                </div>
                                            ) : t.reference}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">
                                            {t.initiatedByName || 'System'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transaction history matching your filters.</td>
                                    </tr>
                                )}
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6">
                        <div className="lg:col-span-1">
                            <Card className="p-4 sm:p-6 h-full border-t-4 border-t-indigo-500">
                                <h3 className="font-bold text-lg text-gray-800 mb-4">New Transaction</h3>
                                <form onSubmit={handleTransactionSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTxType('STOCK')}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${txType === 'STOCK' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    Receive Stock
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTxType('EXPENSE')}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${txType === 'EXPENSE' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    Expense
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setTxType('PAYMENT')}
                                                className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${txType === 'PAYMENT' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                Make Payment
                                            </button>
                                        </div>
                                    </div>

                                    {txType === 'STOCK' && (
                                        <div className="space-y-3 animate-in fade-in">
                                            <Select
                                                label="Product"
                                                value={stockItem.productId}
                                                onChange={(e) => setStockItem({...stockItem, productId: e.target.value})}
                                                required
                                            >
                                                <option value="">Select Product...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </Select>
                                            <Input 
                                                label="Quantity" 
                                                type="number" 
                                                value={stockItem.quantity} 
                                                onChange={(e) => setStockItem({...stockItem, quantity: e.target.value})}
                                                required
                                            />
                                            <Input 
                                                label="Unit Cost (₦)" 
                                                type="number" 
                                                step="0.01"
                                                value={stockItem.cost} 
                                                onChange={(e) => setStockItem({...stockItem, cost: e.target.value})}
                                                required
                                            />
                                        </div>
                                    )}

                                    {txType === 'EXPENSE' && (
                                        <div className="space-y-3 animate-in fade-in">
                                            <Input 
                                                label="Description" 
                                                placeholder="e.g. Delivery Fee"
                                                value={expenseData.description} 
                                                onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                                                required
                                            />
                                            <Input 
                                                label="Amount (₦)" 
                                                type="number" 
                                                step="0.01"
                                                value={expenseData.amount} 
                                                onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                                                required
                                            />
                                            <Input 
                                                label="Date" 
                                                type="date"
                                                value={expenseData.date} 
                                                onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                                                required
                                            />
                                        </div>
                                    )}

                                    {txType === 'PAYMENT' && (
                                        <div className="space-y-3 animate-in fade-in">
                                            <Input 
                                                label="Amount (₦)" 
                                                type="number" 
                                                step="0.01" 
                                                value={paymentData.amount} 
                                                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                                required
                                            />
                                            <Select
                                                label="Method"
                                                value={paymentData.method}
                                                onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                                            >
                                                <option>Bank Transfer</option>
                                                <option>Check</option>
                                                <option>Cash</option>
                                                <option>Credit Card</option>
                                            </Select>
                                            <Input 
                                                label="Reference #" 
                                                placeholder="e.g. CHK-1001"
                                                value={paymentData.reference} 
                                                onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                                            />
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 py-2.5">
                                        Confirm Transaction
                                    </Button>
                                </form>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card className="p-4 sm:p-6 h-full bg-gray-50 flex flex-col justify-center">
                                  <div className="space-y-4">
                                      <h4 className="font-bold text-gray-800">Transaction Guide</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                          <div className={`p-4 rounded-lg border bg-white ${txType === 'STOCK' ? 'ring-2 ring-blue-500' : ''}`}>
                                              <div className="flex items-center gap-2 mb-2 font-bold text-blue-700">
                                                  <Package className="w-4 h-4" /> Stock
                                              </div>
                                              <p className="text-xs text-gray-500">Increases debt to supplier. Updates inventory stock levels immediately.</p>
                                          </div>
                                          <div className={`p-4 rounded-lg border bg-white ${txType === 'EXPENSE' ? 'ring-2 ring-orange-500' : ''}`}>
                                              <div className="flex items-center gap-2 mb-2 font-bold text-orange-700">
                                                  <FileText className="w-4 h-4" /> Expense
                                              </div>
                                              <p className="text-xs text-gray-500">Increases debt to supplier. Used for delivery fees, service charges, etc.</p>
                                          </div>
                                          <div className={`p-4 rounded-lg border bg-white ${txType === 'PAYMENT' ? 'ring-2 ring-green-500' : ''}`}>
                                              <div className="flex items-center gap-2 mb-2 font-bold text-green-700">
                                                  <DollarSign className="w-4 h-4" /> Payment
                                              </div>
                                              <p className="text-xs text-gray-500">Decreases debt to supplier. Records outgoing cash flow.</p>
                                          </div>
                                      </div>
                                  </div>
                            </Card>
                        </div>
                    </div>
                )}
             </div>
          ) : (
            <div className="p-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                    <Building className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium">No Supplier Selected</h3>
                <p className="text-gray-500 text-sm mt-1">Select a supplier from the list above to view their ledger.</p>
            </div>
          )}
      </Card>
    </div>
  );
};