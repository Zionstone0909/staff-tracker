// c:\Users\HP\Downloads\Jireh-Fishes-main\components\Supplier.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Supplier as SupplierType, SupplierTransaction } from '../types';
import { Role } from '../types';
import { BackButton, Button, Card, Table, Badge, Input } from './Shared';
import { Plus, Mail, Phone, Search, X, Building, UserCheck, Trash2, MapPin, LayoutList, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

// --- Supplier History Modal with Ledger ---
const SupplierHistoryModal = ({ 
  supplier, 
  onClose, 
  transactions,
  onViewLedger
}: { 
  supplier: SupplierType;
  onClose: () => void; 
  transactions: SupplierTransaction[];
  onViewLedger: (supplier: SupplierType) => void;
}) => {
  const [selectedTab, setSelectedTab] = useState<'history' | 'summary'>('history');
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Calculate stats
  const stats = useMemo(() => {
    let debit = 0;
    let credit = 0;
    transactions.forEach(t => {
      if (t.type === 'SUPPLY' || t.type === 'EXPENSE') {
        debit += t.amount;
      } else if (t.type === 'PAYMENT') {
        credit += t.amount;
      }
    });
    return { debit, credit, balance: debit - credit };
  }, [transactions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" /> 
            {supplier.name} — Transaction History
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 px-4 overflow-x-auto">
          <button 
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Transaction History
          </button>
          <button 
            onClick={() => setSelectedTab('summary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Summary & Balance
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(100vh-300px)]">
          {selectedTab === 'history' ? (
            <div className="overflow-x-auto">
              <Table headers={['Date', 'Type', 'Description', 'Debit (Owed)', 'Credit (Paid)', 'Initiated By']}>
                {transactions.length > 0 ? (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <Badge color={t.type === 'PAYMENT' ? 'green' : t.type === 'SUPPLY' ? 'blue' : 'yellow'}>
                          {t.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 min-w-[250px]">{t.description}</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-600 whitespace-nowrap">
                        {t.type !== 'PAYMENT' ? `₦${t.amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600 whitespace-nowrap">
                        {t.type === 'PAYMENT' ? `₦${t.amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">
                        {t.initiatedByName || 'System'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No transaction history for this supplier.
                    </td>
                  </tr>
                )}
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Owed (Debit)</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">₦{stats.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-blue-400" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Total Paid (Credit)</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">₦{stats.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <ArrowDownLeft className="w-8 h-8 text-green-400" />
                </div>
              </Card>

              <Card className={`p-6 bg-gradient-to-br border-l-4 ${stats.balance > 0 ? 'from-red-50 to-red-100 border-l-red-500' : 'from-emerald-50 to-emerald-100 border-l-emerald-500'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: stats.balance > 0 ? '#dc2626' : '#059669' }}>
                      Outstanding Balance
                    </p>
                    <p className="text-3xl font-bold mt-2" style={{ color: stats.balance > 0 ? '#7f1d1d' : '#065f46' }}>
                      ₦{Math.abs(stats.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs mt-2" style={{ color: stats.balance > 0 ? '#dc2626' : '#059669' }}>
                      {stats.balance > 0 ? 'You owe supplier' : 'Account settled'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Supplier Details Card */}
              <Card className="md:col-span-3 p-6 bg-gray-50">
                <h4 className="font-bold text-gray-800 mb-4">Supplier Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Contact Person</p>
                    <p className="text-gray-900 font-semibold">{supplier.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Status</p>
                    <Badge color={supplier.status === 'Active' ? 'green' : 'gray'}>{supplier.status}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Email</p>
                    <p className="text-gray-900 font-semibold">{supplier.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Phone</p>
                    <p className="text-gray-900 font-semibold">{supplier.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-500 font-medium">Address</p>
                    <p className="text-gray-900 font-semibold">{supplier.address || 'N/A'}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => { onViewLedger(supplier); onClose(); }} className="flex items-center gap-2">
            <LayoutList className="w-4 h-4" /> View Full Ledger
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Add Supplier Modal ---
interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplier: SupplierType) => void;
}

const AddSupplierModal = ({ isOpen, onClose, onSuccess }: AddSupplierModalProps) => {
  const { addSupplier } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = usePersistentState('Supplier.addSupplier.formData', {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newSupplier: Omit<SupplierType, 'id'> = { 
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      status: 'Active'
    };

    onClose();
    onSuccess({ ...newSupplier, id: 'temp-id' });
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    setIsSubmitting(false);

    addSupplier(newSupplier).catch((error: any) => {
      console.error("Error adding supplier:", error);
      alert(`Failed to add supplier in background: ${error.message || "Unknown error"}`);
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> Add New Supplier
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            label="Company Name" 
            placeholder="e.g. Global Tech Supply" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required
            autoFocus 
            disabled={isSubmitting}
          />
          <Input 
            label="Contact Person" 
            placeholder="e.g. Sarah Smith" 
            value={formData.contactPerson} 
            onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
            required 
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Phone" 
              placeholder="(555) 123-4567" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="Email" 
              type="email" 
              placeholder="sales@company.com" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              disabled={isSubmitting}
            />
          </div>
          <Input 
            label="Address" 
            placeholder="Full Business Address" 
            value={formData.address} 
            onChange={e => setFormData({...formData, address: e.target.value})} 
            disabled={isSubmitting}
          />
          
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                'Save Supplier'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Supplier Component ---
export const Supplier = ({ onBack, onViewLedger }: { onBack: () => void; onViewLedger?: (supplier: SupplierType) => void }) => {
  const { suppliers, user, supplierTransactions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null);
  const isAdmin = user?.role === Role.ADMIN;

  const filteredSuppliers = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(lower) || 
      s.contactPerson.toLowerCase().includes(lower) || 
      s.email.toLowerCase().includes(lower) ||
      s.phone.includes(lower)
    );
  }, [suppliers, searchTerm]);

  const getSupplierTransactions = (supplierId: string) => {
    return supplierTransactions.filter(t => t.supplierId === supplierId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              placeholder="Search suppliers..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAddModal(true)} className="whitespace-nowrap w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add Supplier
            </Button>
          )}
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table headers={['Name', 'Contact Info', 'Created By', 'Status', 'Actions']}>
            {filteredSuppliers.map(supplier => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                      {supplier.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{supplier.name}</p>
                      <p className="text-xs text-gray-500 truncate">{supplier.contactPerson}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {supplier.email || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {supplier.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    <UserCheck className="w-3 h-3" />
                    {supplier.createdByName || 'System'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color={supplier.status === 'Active' ? 'green' : 'gray'}>{supplier.status}</Badge>
                </td>
                <td className="px-6 py-4 flex gap-2 whitespace-nowrap">
                  <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={() => setSelectedSupplier(supplier)}>
                    History
                  </Button>
                  {isAdmin && onViewLedger && (
                    <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={() => onViewLedger(supplier)}>
                      <LayoutList className="w-3 h-3" /> Ledger
                    </Button>
                  )}
                  {isAdmin && (
                    <button className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No suppliers found. Try adding a new one.
                </td>
              </tr>
            )}
          </Table>
        </div>
      </Card>

      <AddSupplierModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {}}
      />
      {selectedSupplier && (
        <SupplierHistoryModal
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          transactions={getSupplierTransactions(selectedSupplier.id)}
          onViewLedger={(supplier) => onViewLedger && onViewLedger(supplier)}
        />
      )}
    </div>
  );
};