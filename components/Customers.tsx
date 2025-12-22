// --- Page Components ---
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Role, Sale, Supplier } from '../types';
import { BackButton, Button, Card, Table, Badge, Input } from './Shared';
import { Plus, Mail, Phone, Search, X, Building, UserIcon, UserCheck, Trash2, MapPin, LayoutList } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

// --- Shared Reusable Header (Fixes the Vercel Build Error) ---

export const CustomerSearchHeader = ({ 
  searchTerm, 
  setSearchTerm, 
  onAddClick,
  title = "Customers"
}: { 
  searchTerm: string; 
  setSearchTerm: (val: string) => void; 
  onAddClick?: () => void;
  title?: string;
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {onAddClick && (
          <Button onClick={onAddClick} className="whitespace-nowrap w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add {title === "Customers" ? "Customer" : "Supplier"}
          </Button>
        )}
      </div>
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
    
    const newSupplier: Omit<Supplier, 'id'> = { 
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
        alert(`Failed to add supplier: ${error.message || "Unknown error"}`);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building className="w-4 h-4" /> Add New Supplier</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Company Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus disabled={isSubmitting} />
          <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} required disabled={isSubmitting} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required disabled={isSubmitting} />
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isSubmitting} />
          </div>
          <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={isSubmitting} />
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>Save Supplier</Button>
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
    onClose();
    setFormData({ name: '', email: '', phone: '' });
    setIsSubmitting(false);
    addCustomer(customerData).catch((error) => alert(`Failed to add customer: ${error.message}`));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Add New Customer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus disabled={isSubmitting} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={isSubmitting} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required disabled={isSubmitting} />
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>Save Customer</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerHistoryModal = ({ customer, onClose, sales }: { customer: Customer; onClose: () => void; sales: Sale[] }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">History — {customer.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <Table headers={['Date', 'Total', 'Paid', 'Method', 'Items', 'Staff']}>
            {sales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 text-sm">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(s.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium">₦{s.total.toLocaleString()}</td>
                <td className="px-6 py-4">₦{s.amountPaid.toLocaleString()}</td>
                <td className="px-6 py-4">{s.paymentMethod || '—'}</td>
                <td className="px-6 py-4 text-center">{s.items.length}</td>
                <td className="px-6 py-4">{s.initiatedByName || 'System'}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
};

// --- Main Customers Component ---

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
      
      <CustomerSearchHeader 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onAddClick={() => setShowAddModal(true)} 
      />
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
            <Table headers={['Name', 'Contact Info', 'Staff', 'Total Spent', 'Last Visit', 'Status', 'Actions']}>
                {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{customer.name.charAt(0)}</div>
                                <span className="font-medium text-gray-900">{customer.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <Badge color="gray"><UserCheck className="w-3 h-3 mr-1" />{customer.createdByName || 'System'}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₦{customer.totalSpent.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(customer.lastVisit).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><Badge color={customer.status === 'Active' ? 'green' : 'gray'}>{customer.status}</Badge></td>
                        <td className="px-6 py-4 flex gap-2">
                            <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={onViewLedger}>Ledger</Button>
                            <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={() => setSelectedCustomer(customer)}>History</Button>
                            {isAdmin && <button className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>}
                        </td>
                    </tr>
                ))}
            </Table>
        </div>
      </Card>

      <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
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

// --- Suppliers Component ---

export const Suppliers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger?: () => void }) => {
  const { suppliers, user } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = user?.role === Role.ADMIN;

  const filtered = useMemo(() => {
     const term = searchTerm.toLowerCase();
     return suppliers.filter(s => s.name.toLowerCase().includes(term) || s.contactPerson.toLowerCase().includes(term));
  }, [suppliers, searchTerm]);

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      
      <CustomerSearchHeader 
        title="Suppliers"
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onAddClick={isAdmin ? () => setShowModal(true) : undefined} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(supplier => (
            <Card key={supplier.id} className="p-6 hover:shadow-md flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate">{supplier.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{supplier.contactPerson}</p>
                    </div>
                    <Badge color={supplier.status === 'Active' ? 'green' : 'gray'}>{supplier.status}</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4 flex-grow">
                    <p className="flex items-center gap-2 truncate"><Mail className="w-4 h-4 text-gray-400" /> {supplier.email}</p>
                    <p className="flex items-center gap-2 truncate"><Phone className="w-4 h-4 text-gray-400" /> {supplier.phone}</p>
                    <p className="flex items-center gap-2 truncate"><MapPin className="w-4 h-4 text-gray-400" /> {supplier.address || 'No address'}</p>
                </div>
                {isAdmin && onViewLedger && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button variant="secondary" className="!py-1 !text-xs w-full" onClick={onViewLedger}>
                            <LayoutList className="w-3 h-3 mr-1" /> View Ledger
                        </Button>
                    </div>
                )}
            </Card>
        ))}
      </div>

      <AddSupplierModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => {}} />
    </div>
  );
};