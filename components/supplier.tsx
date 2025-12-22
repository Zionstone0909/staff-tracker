import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Role, Supplier } from '../types';
import { BackButton, Button, Card, Table, Badge, Input } from './Shared';
import { 
  Plus, Mail, Phone, Search, X, 
  UserCheck, Trash2, MapPin, LayoutList, Building 
} from 'lucide-react';

// --- Reusable Header ---
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
            <Plus className="w-4 h-4 mr-1" /> Add {title === "Customers" ? "Customer" : "Supplier"}
          </Button>
        )}
      </div>
    </div>
  );
};

// --- Modals ---

const AddCustomerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { addCustomer } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addCustomer({
        ...formData,
        totalSpent: 0,
        balance: 0,
        lastVisit: new Date().toISOString(),
        status: 'Active'
      });
      setFormData({ name: '', email: '', phone: '' });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-indigo-600" /> Add New Customer</h3>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- Main Components ---

export const Customers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger: () => void }) => {
  const { customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.phone.includes(s) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <CustomerSearchHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAddClick={() => setShowAddModal(true)} />
      
      <Card className="overflow-hidden border-none shadow-md">
        <Table headers={['Customer', 'Contact', 'Total Spent', 'Status', 'Actions']}>
          {filtered.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                        {c.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{c.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <div className="flex flex-col">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {c.phone}</span>
                    {c.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail className="w-3 h-3"/> {c.email}</span>}
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-indigo-600">₦{c.totalSpent.toLocaleString()}</td>
              <td className="px-6 py-4"><Badge color={c.status === 'Active' ? 'green' : 'gray'}>{c.status}</Badge></td>
              <td className="px-6 py-4">
                <Button variant="secondary" className="!py-1.5 !px-3 !text-xs shadow-sm" onClick={onViewLedger}>
                  <LayoutList className="w-3 h-3 mr-1" /> Ledger
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};

export const Suppliers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger: () => void }) => {
  const { suppliers, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = user?.role === Role.ADMIN;

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return suppliers.filter(sup => 
        sup.name.toLowerCase().includes(s) || 
        sup.phone.includes(s) ||
        sup.contactPerson?.toLowerCase().includes(s)
    );
  }, [suppliers, searchTerm]);

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <CustomerSearchHeader 
        title="Suppliers" 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        onAddClick={isAdmin ? () => {/* Add Supplier Modal Trigger */} : undefined}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="p-6 hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{s.name}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Verified Supplier</p>
              </div>
              <Building className="w-5 h-5 text-gray-300" />
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
              <p className="flex items-center gap-2 font-medium"><Phone className="w-4 h-4 text-indigo-400" /> {s.phone}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> {s.email || 'No email'}</p>
              {s.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> {s.address}</p>}
            </div>
            {isAdmin && (
              <Button variant="secondary" className="w-full !text-xs flex items-center justify-center gap-2 group" onClick={onViewLedger}>
                View Supplier Ledger <LayoutList className="w-3 h-3 group-hover:scale-110 transition-transform"/>
              </Button>
            )}
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
              <Building className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No suppliers found matching your search.</p>
          </div>
      )}
    </div>
  );
};