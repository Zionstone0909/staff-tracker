import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, Table, Badge, BackButton } from './Shared';
import { Plus, Edit2, Archive, User as UserIcon, Loader2, X } from 'lucide-react';
import usePersistentState from '../hooks/usePersistentState';
import { Product, Role } from '../types';

export const Inventory = ({ onBack }: { onBack?: () => void }) => {
  const { products, addProduct, updateProduct, updateProductStock, user } = useApp();
  const [showAddForm, setShowAddForm] = usePersistentState<boolean>('Inventory.showAddForm', false);
  
  // Form State
  const [newProduct, setNewProduct] = usePersistentState<Partial<Product>>('Inventory.newProduct', {});
  const [editingId, setEditingId] = usePersistentState<string | null>('Inventory.editingId', null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === Role.ADMIN;
  // Allow staff to update stock counts directly in the list
  const canUpdateStock = isAdmin || user?.role === Role.STAFF;

  const handleAddNewClick = () => {
      setNewProduct({});
      setEditingId(null);
      setShowAddForm(true);
  };

  const handleEditClick = (product: Product) => {
      setNewProduct({
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          cost: product.cost,
          quantity: product.quantity,
          minStockLevel: product.minStockLevel
      });
      setEditingId(product.id);
      setShowAddForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
      setShowAddForm(false);
      setNewProduct({});
      setEditingId(null);
      setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    setIsSubmitting(true);
    try {
      const productData = {
        name: newProduct.name!,
        sku: newProduct.sku || 'N/A',
        category: newProduct.category || 'General',
        price: Number(newProduct.price),
        cost: Number(newProduct.cost) || 0,
        quantity: Number(newProduct.quantity) || 0,
        minStockLevel: Number(newProduct.minStockLevel) || 5
      };

      if (editingId) {
          await updateProduct(editingId, productData);
          alert('Product updated successfully');
      } else {
          await addProduct(productData);
      }

      // Success cleanup - do this inside try to avoid unmount issues if parent unmounts (unlikely here but safe)
      setNewProduct({});
      setEditingId(null);
      setShowAddForm(false);
      
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        {isAdmin && !showAddForm && (
          <Button onClick={handleAddNewClick} disabled={isSubmitting} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        )}
      </div>

      {showAddForm && isAdmin && (
        <Card className="p-4 sm:p-6 mb-6 bg-indigo-50 border-indigo-100 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-indigo-900">{editingId ? 'Edit Product' : 'Add New Item'}</h3>
            <button onClick={handleCancel} className="text-indigo-400 hover:text-indigo-700">
                <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input 
              label="Product Name"
              placeholder="e.g. Wireless Mouse" 
              value={newProduct.name || ''} 
              onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="SKU / Barcode"
              placeholder="e.g. WM-001" 
              value={newProduct.sku || ''} 
              onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="Category"
              placeholder="e.g. Electronics" 
              value={newProduct.category || ''} 
              onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
              disabled={isSubmitting}
            />
            <Input 
              label="Selling Price (₦)"
              placeholder="0.00" 
              type="number" 
              value={newProduct.price || ''} 
              onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="Cost Price (₦)"
              placeholder="0.00" 
              type="number" 
              value={newProduct.cost !== undefined ? newProduct.cost : ''} 
              onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} 
              disabled={isSubmitting}
            />
            <Input 
              label="Initial Quantity"
              placeholder="0" 
              type="number" 
              value={newProduct.quantity !== undefined ? newProduct.quantity : ''} 
              onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})} 
              disabled={isSubmitting}
            />
            <Input 
              label="Low Stock Alert Level"
              placeholder="5" 
              type="number" 
              value={newProduct.minStockLevel !== undefined ? newProduct.minStockLevel : ''} 
              onChange={e => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})} 
              disabled={isSubmitting}
            />
            <div className="flex items-end gap-2">
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {editingId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (editingId ? 'Update Item' : 'Save Item')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table headers={['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Created By', 'Actions']}>
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{product.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{product.category}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">₦{product.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{product.quantity}</span>
                    {canUpdateStock && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateProductStock(product.id, 1)} className="text-green-600 bg-green-100 hover:bg-green-200 rounded px-1.5 font-bold transition-colors">+</button>
                        <button onClick={() => updateProductStock(product.id, -1)} className="text-red-600 bg-red-100 hover:bg-red-200 rounded px-1.5 font-bold transition-colors">-</button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.quantity <= product.minStockLevel ? (
                    <Badge color="red">Low Stock</Badge>
                  ) : (
                    <Badge color="green">In Stock</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                      <span>{product.createdByName || 'System'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {isAdmin && (
                    <button 
                        onClick={() => handleEditClick(product)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No products found. Click "Add New Product" to get started.
                </td>
              </tr>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
};