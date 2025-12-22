import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import { History, Package, AlertTriangle, ArrowRightLeft, ShieldAlert, Search } from 'lucide-react';
import { StockMovement, Role } from '../types';
import usePersistentState from '../hooks/usePersistentState';

// --- Components ---

const CurrentStockList = () => {
  const { products } = useApp();
  const [filter, setFilter] = useState('');

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.sku.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text"
            placeholder="Search stock by name or SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
            <Table headers={['Product Name', 'SKU', 'Category', 'Quantity', 'Status', 'Value']}>
            {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{p.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{p.category}</td>
                <td className="px-6 py-4 text-lg font-bold text-gray-800 whitespace-nowrap">{p.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {p.quantity <= p.minStockLevel ? (
                    <Badge color="red">Low Stock</Badge>
                    ) : (
                    <Badge color="green">Good</Badge>
                    )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    ₦{(p.quantity * p.price).toFixed(2)}
                </td>
                </tr>
            ))}
            {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No stock items found.</td></tr>
            )}
            </Table>
        </div>
      </Card>
    </div>
  );
};

const StockAdjustmentForm = () => {
  const { products, adjustStock, user } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  
    const [formData, setFormData] = usePersistentState('Stock.adjustment.formData', {
        productId: '',
        type: 'CORRECTION' as StockMovement['type'],
        quantity: '',
        action: 'add', // add or remove
        reason: ''
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) return;
    
    let qty = Number(formData.quantity);
    if (qty <= 0) {
        alert("Please enter a valid positive quantity.");
        return;
    }

    // Determine sign based on type/action
    let finalQty = qty;
    
    if (formData.type === 'DAMAGE' || formData.type === 'LOSS') {
        finalQty = -qty; // Always negative
    } else if (formData.type === 'CORRECTION') {
        finalQty = formData.action === 'remove' ? -qty : qty;
    }

    adjustStock(formData.productId, finalQty, formData.type, formData.reason);
    setFormData({ productId: '', type: 'CORRECTION', quantity: '', action: 'add', reason: '' });
    alert('Stock adjustment recorded.');
  };

  if (!isAdmin) {
      return (
        <Card className="p-8 text-center text-gray-500">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-300" />
            <p>Only Administrators can perform stock adjustments.</p>
        </Card>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1">
          <Card className="p-6 border-t-4 border-t-orange-500">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Adjust Stock
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Product"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    required
                >
                    <option value="">Select Product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>)}
                </Select>

                <Select
                    label="Adjustment Type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="CORRECTION">Inventory Correction</option>
                    <option value="DAMAGE">Damaged Goods</option>
                    <option value="LOSS">Loss / Theft</option>
                </Select>

                {formData.type === 'CORRECTION' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                        <div className="flex bg-gray-100 p-1 rounded-md">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, action: 'add'})}
                                className={`flex-1 py-1 text-sm font-medium rounded transition-all ${formData.action === 'add' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Add (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, action: 'remove'})}
                                className={`flex-1 py-1 text-sm font-medium rounded transition-all ${formData.action === 'remove' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Remove (-)
                            </button>
                        </div>
                    </div>
                )}

                <Input 
                    label="Quantity" 
                    type="number" 
                    placeholder="0" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                />

                <Input 
                    label="Reason / Notes" 
                    placeholder="e.g. Annual Count, Broken in transit" 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                />

                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                    Submit Adjustment
                </Button>
             </form>
          </Card>
       </div>
       <div className="lg:col-span-2">
          <Card className="p-6 bg-orange-50 h-full border border-orange-100">
             <h4 className="font-bold text-orange-900 mb-2">About Adjustments</h4>
             <p className="text-sm text-orange-800 mb-4">
                 Adjustments are used to correct inventory discrepancies or record losses. These actions directly affect stock levels without a corresponding sale or purchase transaction.
             </p>
             <ul className="list-disc list-inside text-sm text-orange-800 space-y-2">
                 <li><b>Correction:</b> Use when physical count doesn't match system count.</li>
                 <li><b>Damage:</b> Items broken, expired, or unsellable.</li>
                 <li><b>Loss:</b> Items missing due to theft or unknown reasons.</li>
             </ul>
          </Card>
       </div>
    </div>
  );
};

const StockMovementForm = () => {
  const { products, adjustStock, user } = useApp();
  
    const [formData, setFormData] = usePersistentState('Stock.movement.formData', {
        productId: '',
        type: 'TRANSFER_OUT' as StockMovement['type'],
        quantity: '',
        reason: ''
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) return;
    
    let qty = Number(formData.quantity);
    if (qty <= 0) {
        alert("Please enter a valid positive quantity.");
        return;
    }

    let finalQty = qty;
    // Logic for movement direction
    if (['TRANSFER_OUT', 'INTERNAL_USE', 'RETURN'].includes(formData.type)) {
        finalQty = -qty;
    }
    // TRANSFER_IN is positive

    adjustStock(formData.productId, finalQty, formData.type, formData.reason);
    setFormData({ productId: '', type: 'TRANSFER_OUT', quantity: '', reason: '' });
    alert('Stock movement recorded.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1">
          <Card className="p-6 border-t-4 border-t-blue-500">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Move Stock
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Product"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    required
                >
                    <option value="">Select Product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>)}
                </Select>

                <Select
                    label="Movement Type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="TRANSFER_OUT">Transfer Out (-)</option>
                    <option value="TRANSFER_IN">Transfer In (+)</option>
                    <option value="INTERNAL_USE">Internal Use (-)</option>
                    <option value="RETURN">Return to Supplier (-)</option>
                </Select>

                <Input 
                    label="Quantity" 
                    type="number" 
                    placeholder="0" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                />

                <Input 
                    label="Reference / Destination" 
                    placeholder="e.g. Branch B, Kitchen Use" 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                />

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    Record Movement
                </Button>
             </form>
          </Card>
       </div>
       <div className="lg:col-span-2">
          <Card className="p-6 bg-blue-50 h-full border border-blue-100">
             <h4 className="font-bold text-blue-900 mb-2">About Movements</h4>
             <p className="text-sm text-blue-800 mb-4">
                 Movements track stock relocation or consumption that isn't a direct customer sale.
             </p>
             <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
                 <li><b>Transfer Out:</b> Sending stock to another location or warehouse.</li>
                 <li><b>Transfer In:</b> Receiving stock from another location.</li>
                 <li><b>Internal Use:</b> Consuming stock for business operations (e.g., demos, office supplies).</li>
                 <li><b>Return to Supplier:</b> Sending defective or excess stock back to vendor.</li>
             </ul>
          </Card>
       </div>
    </div>
  );
};

const StockHistory = () => {
    const { stockMovements } = useApp();
    const [filter, setFilter] = useState('');

    const filtered = stockMovements.filter(m => 
        m.productName.toLowerCase().includes(filter.toLowerCase()) ||
        m.type.toLowerCase().includes(filter.toLowerCase()) ||
        (m.reason || '').toLowerCase().includes(filter.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-500" /> Transaction Logs
                </h3>
                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                        placeholder="Search logs..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table headers={['Date', 'Product', 'Type', 'Change', 'Reason', 'User']}>
                    {filtered.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(m.date).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{m.productName}</td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <Badge color={m.quantity > 0 ? 'green' : 'red'}>{m.type}</Badge>
                            </td>
                            <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 min-w-[200px]">{m.reason}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{m.userName}</td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No logs found.</td></tr>
                    )}
                </Table>
            </div>
        </Card>
    );
};

// --- Main Page ---

export const Stock = ({ onBack }: { onBack?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'adjustment' | 'movement' | 'history'>('stock');

  const tabs = [
    { id: 'stock', label: 'Stock Levels', icon: Package },
    { id: 'adjustment', label: 'Stock Adjustment', icon: AlertTriangle },
    { id: 'movement', label: 'Stock Movement', icon: ArrowRightLeft },
    { id: 'history', label: 'History Logs', icon: History },
  ];

  return (
    <div className="space-y-6">
        <BackButton onClick={onBack} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Stock Control</h1>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex overflow-x-auto max-w-full scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'stock' && <CurrentStockList />}
            {activeTab === 'adjustment' && <StockAdjustmentForm />}
            {activeTab === 'movement' && <StockMovementForm />}
            {activeTab === 'history' && <StockHistory />}
        </div>
    </div>
  );
};