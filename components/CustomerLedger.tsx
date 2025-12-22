import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import { Search, User as UserIcon, Loader2, LayoutList, PlusCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Customer } from '../types';
import { CustomerSearchHeader } from './Customers';

export const CustomerLedger = ({ onBack }: { onBack: () => void }) => {
    const [selectedCustomer, setSelectedCustomer] = usePersistentState<Customer | null>('CustomerLedger.selectedCustomer', null);
    const { sales, addSale, user, customers } = useApp();
  
    const [activeTab, setActiveTab] = usePersistentState<'history' | 'transaction'>('CustomerLedger.activeTab', 'history');
  
    // -- Filter State --
    const [startDate, setStartDate] = usePersistentState('CustomerLedger.startDate', (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    })());
    const [endDate, setEndDate] = usePersistentState('CustomerLedger.endDate', (() => new Date().toISOString().split('T')[0])());
    const [filterTerm, setFilterTerm] = usePersistentState('CustomerLedger.filterTerm', '');

    // -- Transaction Form State --
    const [txType, setTxType] = usePersistentState<'PAYMENT' | 'CHARGE'>('CustomerLedger.txType', 'PAYMENT');
    const [amount, setAmount] = usePersistentState('CustomerLedger.amount', '');
    const [method, setMethod] = usePersistentState('CustomerLedger.method', 'Cash');
    const [description, setDescription] = usePersistentState('CustomerLedger.description', '');
    const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats Calculation
  const stats = useMemo(() => {
    if(!selectedCustomer) return { debit: 0, credit: 0 };
    // Debit = Sales/Charges, Credit = Payments
    const history = sales.filter(s => s.customerId === selectedCustomer.id || s.customerName === selectedCustomer.name);
    let debit = 0;
    let credit = 0;
    history.forEach(s => {
        debit += s.total;
        credit += s.amountPaid;
    });
    return { debit, credit };
  }, [sales, selectedCustomer]);

  const filteredHistory = useMemo(() => {
    if(!selectedCustomer) return [];
    
    // 1. Get all sales for customer
    let data = sales.filter(s => s.customerId === selectedCustomer.id || s.customerName === selectedCustomer.name);
    
    // 2. Filter by Date
    data = data.filter(s => {
        const d = s.date.split('T')[0];
        return d >= startDate && d <= endDate;
    });

    // 3. Filter by Search Term (ID, Total, Staff)
    if (filterTerm) {
        const lower = filterTerm.toLowerCase();
        data = data.filter(s => 
            s.id.toLowerCase().includes(lower) ||
            s.total.toString().includes(lower) ||
            (s.initiatedByName || '').toLowerCase().includes(lower)
        );
    }

    return data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, selectedCustomer, startDate, endDate, filterTerm]);

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !user || !amount) return;
    
    setIsSubmitting(true);
    try {
        if (txType === 'PAYMENT') {
            // Sale with 0 total acts as payment (Credit)
            await addSale({
                date: new Date().toISOString(),
                total: 0,
                amountPaid: Number(amount),
                items: [],
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                paymentMethod: method,
                initiatedBy: user.id,
                initiatedByName: user.name
            });
            alert('Payment recorded successfully.');
        } else {
             // Charge: Sale with total > 0 and 0 paid (Debit)
             await addSale({
                date: new Date().toISOString(),
                total: Number(amount),
                amountPaid: 0,
                items: [], 
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                paymentMethod: 'Credit',
                initiatedBy: user.id,
                initiatedByName: user.name,
            });
            alert('Manual charge recorded successfully.');
        }

        setAmount('');
        setDescription('');
        setActiveTab('history');
    } catch (e) {
        console.error(e);
        alert('Failed to record transaction');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Customer Ledger</h1>
        <div className="w-full lg:w-auto">
            <CustomerSearchHeader 
                placeholder="Select customer to view ledger..."
                onSelect={(c) => setSelectedCustomer(c)}
                selectedCustomerId={selectedCustomer?.id}
            />
        </div>
      </div>

      {selectedCustomer ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Customer Summary Card */}
            <Card className="p-0 overflow-hidden bg-white border-indigo-100">
                <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                         <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-50 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-600 border border-indigo-100 shrink-0">
                            {selectedCustomer.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{selectedCustomer.name}</h2>
                            <div className="flex flex-col text-xs sm:text-sm text-gray-500">
                                <span className="truncate">{selectedCustomer.email}</span>
                                <span>{selectedCustomer.phone}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Debit (Sales)</span>
                            <span className="text-lg sm:text-xl font-bold text-red-600 flex items-center gap-1">
                                <ArrowUpRight className="w-4 h-4" /> ₦{stats.debit.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                             <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Credit (Paid)</span>
                             <span className="text-lg sm:text-xl font-bold text-green-600 flex items-center gap-1">
                                <ArrowDownLeft className="w-4 h-4" /> ₦{stats.credit.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex flex-col col-span-2 lg:col-span-1">
                             <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Balance</span>
                             <span className={`text-xl sm:text-2xl font-bold ${selectedCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₦{selectedCustomer.balance.toFixed(2)}
                             </span>
                             <span className="text-[10px] sm:text-xs text-gray-400">
                                {selectedCustomer.balance > 0 ? 'Customer owes you' : 'Customer has credit'}
                             </span>
                        </div>
                    </div>
                </div>
            </Card>

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
                <Card className="overflow-hidden">
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
                                placeholder="Search transaction ID or staff..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500"
                                value={filterTerm}
                                onChange={(e) => setFilterTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table headers={['Date', 'Type', 'Description', 'Debit (Charge)', 'Credit (Pay)', 'Balance Impact', 'Status', 'Staff']}>
                            {filteredHistory.map(sale => {
                                const isPayment = sale.total === 0 && sale.amountPaid > 0;
                                const balance = sale.total - sale.amountPaid;
                                let statusNode = <Badge color="green">Paid</Badge>;
                                
                                if (isPayment) {
                                    statusNode = <Badge color="blue">Credit</Badge>;
                                } else {
                                    if (balance > 0.01) statusNode = <Badge color="yellow">Partial</Badge>;
                                    if (sale.amountPaid === 0) statusNode = <Badge color="red">Unpaid</Badge>;
                                }
                                
                                return (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <Badge color={isPayment ? 'blue' : 'red'}>
                                                {isPayment ? 'CREDIT' : 'DEBIT'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 min-w-[200px]">
                                            {isPayment ? (
                                                <span className="font-medium">Payment Received</span>
                                            ) : (
                                                sale.items.length > 0 ? `Purchase (${sale.items.length} items)` : 'Manual Charge'
                                            )}
                                            <div className="text-xs text-gray-400 font-mono">#{sale.id.slice(-6)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-red-600 whitespace-nowrap">
                                            {sale.total > 0 ? `₦${sale.total.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600 whitespace-nowrap">
                                            {sale.amountPaid > 0 ? `₦${sale.amountPaid.toFixed(2)}` : '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {isPayment ? `-₦${sale.amountPaid.toFixed(2)}` : `+₦${balance.toFixed(2)}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{statusNode}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                            {sale.initiatedByName || 'System'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No transaction history found for this period.</td>
                                </tr>
                            )}
                        </Table>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <Card className="p-4 sm:p-6 h-full border-t-4 border-t-indigo-500">
                             <h3 className="font-bold text-lg text-gray-800 mb-4">New Ledger Entry</h3>
                             <form onSubmit={handleSubmitTransaction} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTxType('PAYMENT')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${txType === 'PAYMENT' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            Receive Payment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTxType('CHARGE')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${txType === 'CHARGE' ? 'bg-red-100 text-red-700 ring-2 ring-red-200' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            Manual Charge
                                        </button>
                                    </div>
                                </div>

                                <Input 
                                    label="Amount (₦)" 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    autoFocus
                                />

                                {txType === 'PAYMENT' && (
                                    <Select
                                        label="Payment Method"
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                    >
                                        <option>Cash</option>
                                        <option>Card</option>
                                        <option>Bank Transfer</option>
                                        <option>Check</option>
                                    </Select>
                                )}

                                <Input 
                                    label="Description / Notes" 
                                    placeholder="Optional notes..." 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />

                                <Button type="submit" className={`w-full py-2.5 ${txType === 'PAYMENT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        txType === 'PAYMENT' ? 'Confirm Payment' : 'Confirm Charge'
                                    )}
                                </Button>
                             </form>
                        </Card>
                    </div>
                    <div className="md:col-span-2">
                         <Card className="p-4 sm:p-6 h-full bg-gray-50 flex flex-col justify-center">
                              <div className="space-y-6">
                                  <div className={`p-4 rounded-lg border ${txType === 'PAYMENT' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                      <h4 className={`font-bold mb-2 ${txType === 'PAYMENT' ? 'text-green-800' : 'text-red-800'}`}>
                                          {txType === 'PAYMENT' ? 'About Receiving Payments' : 'About Manual Charges'}
                                      </h4>
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                          {txType === 'PAYMENT' 
                                            ? "Recording a payment decreases the customer's outstanding balance. Use this for payments made on account, partial payments for previous purchases, or settling debts."
                                            : "Recording a charge increases the customer's outstanding balance without deducting inventory. Use this for opening balances, service fees, or corrections."
                                          }
                                      </p>
                                  </div>
                              </div>
                         </Card>
                    </div>
                </div>
            )}
        </div>
      ) : (
        <Card className="p-8 sm:p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Customer Selected</h3>
            <p className="text-gray-500 max-w-sm mt-1">Use the search bar in the top right to select a customer and view their transaction history and ledger details.</p>
        </Card>
      )}
    </div>
  );
};