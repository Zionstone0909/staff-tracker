import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, BackButton, Table, Badge, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import ApiClient from '../services/ApiClient';
import { DollarSign, Save, UserCheck, Search, History } from 'lucide-react';
import { Expense } from '../types';

export const BankDeposit = () => {
  const { addExpense } = useApp();
  // State for backend data
  const [history, setHistory] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = usePersistentState('BankDeposit.formData', {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    reference: '',
    paymentMethod: 'Bank Transfer'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Load History from Backend
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get('/api/deposits');
      setHistory(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || String(err));
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. Filter History locally for search
  const deposits = useMemo(() => {
    return history
      .filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (e.reference && e.reference.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, searchTerm]);

  // 3. Submit to Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const depositData = {
      type: 'DEPOSIT',
      date: formData.date,
      category: 'Income',
      description: formData.description,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      status: 'Paid',
    };

    try {
      const savedDeposit = await ApiClient.post('/api/deposits', depositData);
      
      // Update local state and context
      setHistory([savedDeposit, ...history]);
      addExpense(savedDeposit); 
      
      alert('Deposit recorded successfully!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        reference: '',
        paymentMethod: 'Bank Transfer'
      });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Bank Deposit</h1>
            <p className="text-sm md:text-base text-gray-500">Record income to the company account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6 border-t-4 border-t-green-500 sticky top-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        New Deposit
                    </h3>

                    <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                    <Input label="Amount (₦)" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                    <Input label="Description / Source" placeholder="Daily Sales" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                    <Select label="Method" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                        <option>Bank Transfer</option>
                        <option>Cash Deposit</option>
                        <option>Check</option>
                    </Select>
                    <Input label="Reference ID" placeholder="TRX-12345" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} />

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 mt-4">
                        <Save className="w-4 h-4" /> Record Deposit
                    </Button>
                </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" /> Deposit History
                    </h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <Input placeholder="Search..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading history...</div>
                    ) : error ? (
                        <div className="p-10 text-center text-red-500">Error: {error}</div>
                    ) : (
                        <Table headers={['Date', 'Description', 'Reference', 'Amount', 'Method', 'By']}>
                            {deposits.map(deposit => (
                                <tr key={deposit.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(deposit.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{deposit.description}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{deposit.reference || '-'}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">₦{deposit.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm"><Badge color="green">{deposit.paymentMethod}</Badge></td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <UserCheck className="w-3 h-3" />
                                            <span>{deposit.recordedByName || 'System'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
            </Card>
          </div>
      </div>
    </div>
  );
};
