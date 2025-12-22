import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, BackButton, Table, Badge, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import { DollarSign, Save, UserCheck, Search, Calendar, Users, Loader2, Clock } from 'lucide-react';

export const Payroll = () => {
  const { addPayroll, payroll, users, invitations } = useApp();
    const [formData, setFormData] = usePersistentState('Payroll.formData', {
        staffId: '',
        staffName: '', // Stored separately if manual entry is needed, otherwise derived
        department: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        periodStart: '',
        periodEnd: ''
    });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter payroll history
  const filteredPayroll = useMemo(() => {
    return payroll
      .filter(entry => 
        entry.staffName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payroll, searchTerm]);

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value.startsWith('PENDING:')) {
        // Handle Pending User
        const [_, name] = value.split(':');
        setFormData({
            ...formData,
            staffId: value, // Use the compound ID for uniqueness
            staffName: name
        });
    } else {
        // Handle Registered User
        const user = users.find(u => u.id === value);
        setFormData({
            ...formData,
            staffId: value,
            staffName: user ? user.name : ''
        });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.amount || !formData.department) return;

    setIsSubmitting(true);
    try {
        await addPayroll({
            staffId: formData.staffId,
            staffName: formData.staffName,
            department: formData.department,
            amount: Number(formData.amount),
            paymentDate: formData.paymentDate,
            periodStart: formData.periodStart,
            periodEnd: formData.periodEnd
        });
        
        alert(`Payroll processed successfully for ${formData.staffName}! Expense record created.`);
        
        // Reset form
        setFormData({
            staffId: '',
            staffName: '',
            department: '',
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            periodStart: '',
            periodEnd: ''
        });
    } catch (error) {
        console.error("Payroll error:", error);
        alert("Failed to process payroll.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // Combine users and pending invitations for the dropdown
  const pendingStaff = invitations.filter(i => i.status === 'PENDING');

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
            <p className="text-sm md:text-base text-gray-500">Process staff salaries and track payment history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Payroll Entry Form */}
          <div className="xl:col-span-1">
            <Card className="p-4 sm:p-6 border-t-4 border-t-indigo-500 sticky top-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            New Payment
                        </h3>
                    </div>

                    <Select
                        label="Staff Member"
                        value={formData.staffId}
                        onChange={handleUserSelect}
                        required
                    >
                        <option value="">Select Staff...</option>
                        <optgroup label="Active Staff">
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </optgroup>
                        {pendingStaff.length > 0 && (
                            <optgroup label="Pending Invitations">
                                {pendingStaff.map(i => (
                                    <option key={i.token} value={`PENDING:${i.name}`}>
                                        {i.name} (Invited)
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </Select>

                    <Input 
                        label="Department" 
                        placeholder="e.g. Sales, Logistics"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input 
                            label="Amount (₦)" 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            required
                        />
                        <Input 
                            label="Payment Date" 
                            type="date" 
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                            required
                        />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Pay Period
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <Input 
                                label="Start Date" 
                                type="date"
                                className="text-xs"
                                value={formData.periodStart}
                                onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                                required
                            />
                            <Input 
                                label="End Date" 
                                type="date"
                                className="text-xs"
                                value={formData.periodEnd}
                                onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Process Payment
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-2">
                            Automatically records as a company expense.
                        </p>
                    </div>
                </form>
            </Card>
          </div>

          {/* History Section */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" /> Payment History
                    </h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <Input 
                            placeholder="Search staff or dept..." 
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table headers={['Date', 'Staff', 'Department', 'Period', 'Amount', 'Processed By']}>
                        {filteredPayroll.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(entry.paymentDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900">{entry.staffName}</div>
                                        {entry.staffId.startsWith('PENDING:') && (
                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">Pending</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                    <Badge color="blue">{entry.department}</Badge>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(entry.periodStart).toLocaleDateString()} - {new Date(entry.periodEnd).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                                    ₦{entry.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <UserCheck className="w-3 h-3 text-gray-400" />
                                        <span>{entry.processedByName || 'System'}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredPayroll.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No payroll history found.
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </Card>
          </div>
      </div>
    </div>
  );
};