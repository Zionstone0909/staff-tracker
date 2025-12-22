import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import { Plus, Search, Mail, Phone, MapPin, User as UserIcon, X, Check, Building, Trash2, UserCheck, Loader2, LayoutList } from 'lucide-react';
import { Customer, Supplier, Role } from '../types';

// --- Shared Components ---

export const CustomerSearchHeader = ({ 
  placeholder, 
  onSearchChange, 
  onSelect, 
  selectedCustomerId 
}: { 
  placeholder?: string;
  onSearchChange?: (term: string) => void;
  onSelect?: (customer: Customer) => void;
  selectedCustomerId?: string;
}) => {
  const { customers } = useApp();
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTerm(val);
    if (onSearchChange) onSearchChange(val);
    if (onSelect) setIsOpen(true);
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(term.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
       <div className="relative">
         <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
         <input 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder={placeholder}
            value={term}
            onChange={handleSearch}
            onFocus={() => onSelect && setIsOpen(true)}
         />
       </div>
       {isOpen && onSelect && (
         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {filtered.map(c => (
              <div 
                key={c.id} 
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex justify-between items-center ${c.id === selectedCustomerId ? 'bg-indigo-50' : ''}`}
                onClick={() => {
                   onSelect(c);
                   setTerm(c.name);
                   setIsOpen(false);
                }}
              >
                 <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                 </div>
                 {c.id === selectedCustomerId && <Check className="w-4 h-4 text-indigo-600" />}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No customers found</div>}
         </div>
       )}
    </div>
  );
};

// --- Modals ---

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
}

const AddSupplierModal = ({ isOpen, onClose, onSuccess }: AddSupplierModalProps) => {
  const { addSupplier } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = usePersistentState('Customers.addSupplier.formData', {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });

  // Handle Escape key
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
    
    // Construct the object
    const newSupplier: Omit<Supplier, 'id'> = { 
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        status: 'Active'
    };

    // Close Immediately (Optimistic)
    onClose();
    onSuccess({ ...newSupplier, id: 'temp-id' });
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    setIsSubmitting(false); // Reset for next time

    // Perform Async in Background
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
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-4 h-4" /> Add New Supplier
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
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                Save Supplier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCustomerModal = ({ isOpen, onClose }: AddCustomerModalProps) => {
  const { addCustomer } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = usePersistentState('Customers.addCustomer.formData', {
    name: '',
    email: '',
    phone: ''
  });

  // Handle Escape key
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

    const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        totalSpent: 0,
        balance: 0,
        lastVisit: new Date().toISOString(),
        status: 'Active' as const
    };

    // Close Immediately
    onClose();
    setFormData({ name: '', email: '', phone: '' });
    setIsSubmitting(false);

    // Run in background
    addCustomer(customerData).catch((error) => {
        console.error("Error adding customer:", error);
        alert(`Failed to add customer in background: ${error.message}`);
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
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Add New Customer
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            label="Full Name" 
            placeholder="e.g. John Doe" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required
            autoFocus 
            disabled={isSubmitting}
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="john@example.com" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
            disabled={isSubmitting}
          />
          <Input 
            label="Phone" 
            placeholder="(555) 000-0000" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
            required 
            disabled={isSubmitting}
          />
          
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                Save Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Page Components ---

export const Customers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger: () => void }) => {
  const { customers, user, sales } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const isAdmin = user?.role === Role.ADMIN;

  const filteredCustomers = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return customers.filter(c => 
        c.name.toLowerCase().includes(lower) || 
        c.email.toLowerCase().includes(lower) || 
        c.phone.includes(lower)
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="w-full sm:w-64">
                <CustomerSearchHeader 
                    placeholder="Filter customers..."
                    onSearchChange={(term) => setSearchTerm(term)} 
                />
            </div>
            <Button onClick={() => setShowAddModal(true)} className="whitespace-nowrap w-full sm:w-auto">
                <Plus className="w-4 h-4" /> <span className="sm:hidden md:inline">Add Customer</span><span className="hidden sm:inline md:hidden">Add</span>
            </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
            <Table headers={['Name', 'Contact Info', 'Created By', 'Total Spent', 'Last Visit', 'Status', 'Actions']}>
                {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                    {customer.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-900">{customer.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                            </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                               <UserCheck className="w-3 h-3" />
                               {customer.createdByName || 'System'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">₦{customer.totalSpent.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(customer.lastVisit).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color={customer.status === 'Active' ? 'green' : 'gray'}>{customer.status}</Badge>
                        </td>
                        <td className="px-6 py-4 flex gap-2 whitespace-nowrap">
                            <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={onViewLedger}>
                                View Ledger
                            </Button>
                          <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={() => setSelectedCustomer(customer)}>
                            History
                          </Button>
                            {isAdmin && (
                                <button className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                 {filteredCustomers.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No customers found. Try adding a new one.
                        </td>
                    </tr>
                )}
            </Table>
        </div>
      </Card>

      <AddCustomerModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      {selectedCustomer && (
        <CustomerHistoryModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          sales={sales.filter(s => s.customerId === selectedCustomer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        />
      )}
    </div>
  );
};

const CustomerHistoryModal = ({ customer, onClose, sales }: { customer: Customer; onClose: () => void; sales: import('../types').Sale[] }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">History — {customer.name}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <Table headers={[ 'Date', 'Total', 'Paid', 'Payment Method', 'Items', 'Processed By' ]}>
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(s.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₦{s.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₦{s.amountPaid.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.paymentMethod || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.items.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.initiatedByName || 'System'}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No history for this customer.</td>
                </tr>
              )}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Suppliers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger?: () => void }) => {
  const { suppliers, user } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = user?.role === Role.ADMIN;

  const filtered = useMemo(() => {
     const term = searchTerm.toLowerCase();
     return suppliers.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.contactPerson.toLowerCase().includes(term) || 
        s.email.toLowerCase().includes(term)
     );
  }, [suppliers, searchTerm]);

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
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {isAdmin && (
              <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto"><Plus className="w-4 h-4" /> Add Supplier</Button>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(supplier => (
            <Card key={supplier.id} className="p-6 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate">{supplier.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{supplier.contactPerson}</p>
                    </div>
                    <Badge color={supplier.status === 'Active' ? 'green' : 'gray'}>{supplier.status}</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4 flex-grow">
                    <p className="flex items-center gap-2 truncate"><Mail className="w-4 h-4 text-gray-400 shrink-0" /> {supplier.email}</p>
                    <p className="flex items-center gap-2 truncate"><Phone className="w-4 h-4 text-gray-400 shrink-0" /> {supplier.phone}</p>
                    <p className="flex items-center gap-2 truncate"><MapPin className="w-4 h-4 text-gray-400 shrink-0" /> {supplier.address || 'No address provided'}</p>
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                        <UserCheck className="w-3 h-3" />
                        Added by: {supplier.createdByName || 'System'}
                    </div>
                </div>
                
                {isAdmin && onViewLedger && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <Button variant="secondary" className="!py-1 !px-3 !text-xs w-full sm:w-auto" onClick={onViewLedger}>
                            <LayoutList className="w-3 h-3 mr-1" /> View Ledger
                        </Button>
                    </div>
                )}
            </Card>
        ))}
        {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 border-2 border-dashed rounded-xl">
                No suppliers found. Add one to get started.
            </div>
        )}
      </div>

      <AddSupplierModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => {}} 
      />
    </div>
  );
};