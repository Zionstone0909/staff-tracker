import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import usePersistentState from '../hooks/usePersistentState';
import { Card, Button, Input, Badge, Table, BackButton, Select } from './Shared';
import { CustomerSearchHeader } from './Customers';
import { Plus, Search, Trash2, ShoppingCart, User as UserIcon, X, Wallet, CreditCard, DollarSign, UserCheck } from 'lucide-react';
import { SaleItem, Sale, Customer, Role } from '../types';

export const Sales = () => {
  const { products, user, addSale, sales } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  
  const [activeTab, setActiveTab] = usePersistentState<'pos' | 'history'>('Sales.activeTab', 'pos');
  
  // POS State
  const [cart, setCart] = usePersistentState<SaleItem[]>('Sales.cart', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = usePersistentState<Customer | null>('Sales.selectedCustomer', null);
  const [amountPaid, setAmountPaid] = usePersistentState<string>('Sales.amountPaid', '');
  const [paymentMethod, setPaymentMethod] = usePersistentState('Sales.paymentMethod', 'Cash');
  
  // History State
  const [historySearch, setHistorySearch] = useState('');

  // Auto-fill amount paid with total initially
  const cartTotal = cart.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  
  useEffect(() => {
     if (cartTotal > 0 && !amountPaid) {
         setAmountPaid(cartTotal.toFixed(2));
     }
  }, [cartTotal]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    if (product.quantity <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      
      // Check stock limit
      const currentQtyInCart = existing ? existing.quantity : 0;
      if (currentQtyInCart + 1 > product.quantity) {
          alert(`Cannot add more. Only ${product.quantity} in stock.`);
          return prev;
      }

      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        price: product.price, 
        subtotal: product.price 
      }];
    });
  };

  const updateCartItem = (productId: string, field: 'quantity' | 'price', value: number) => {
     setCart(prev => prev.map(item => {
         if (item.productId === productId) {
             const product = products.find(p => p.id === productId);
             let newQty = item.quantity;
             let newPrice = item.price;

             if (field === 'quantity') {
                 if (product && value > product.quantity) {
                     alert(`Max stock available is ${product.quantity}`);
                     newQty = product.quantity;
                 } else {
                     newQty = Math.max(1, value);
                 }
             }
             
             if (field === 'price') {
                 newPrice = Math.max(0, value);
             }

             return {
                 ...item,
                 quantity: newQty,
                 price: newPrice,
                 subtotal: newQty * newPrice
             };
         }
         return item;
     }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const paid = Number(amountPaid);
    
    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: cartTotal,
      amountPaid: paid,
      items: [...cart],
      initiatedBy: user!.id,
      initiatedByName: user!.name,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      customerId: selectedCustomer?.id,
      paymentMethod: paymentMethod
    };
    
    addSale(newSale);
    
    // Reset
    setCart([]);
    setSelectedCustomer(null);
    setAmountPaid('');
    setPaymentMethod('Cash');
    alert('Sale processed successfully!');
  };

  // Calculations
  const balanceDue = Math.max(0, cartTotal - Number(amountPaid));
  const changeDue = Math.max(0, Number(amountPaid) - cartTotal);

  // History Logic
  const filteredSales = useMemo(() => {
    // Shared History: Everyone sees everything to ensure stock/ledger transparency
    let baseSales = sales;

    return baseSales.filter(sale => {
      const searchLower = historySearch.toLowerCase();
      return (
        sale.id.includes(searchLower) ||
        (sale.initiatedByName || '').toLowerCase().includes(searchLower) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchLower))
      );
    });
  }, [sales, historySearch, isAdmin, user]);

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-2">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button 
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'pos' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveTab('pos')}
            >
            Point of Sale
            </button>
            <button 
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveTab('history')}
            >
            Sales History
            </button>
        </div>
        
        {activeTab === 'pos' && (
             <div className="w-full md:w-72">
                <CustomerSearchHeader 
                    placeholder="Assign customer..."
                    onSelect={(c) => setSelectedCustomer(c)}
                    selectedCustomerId={selectedCustomer?.id}
                />
            </div>
        )}
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-180px)] lg:min-h-[600px]">
          {/* Product Catalog */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-[500px] lg:h-full">
            <div className="relative shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Scan SKU or search product..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        className={`p-3 sm:p-4 bg-white border rounded-xl flex flex-col justify-between transition-all ${product.quantity > 0 ? 'hover:shadow-md cursor-pointer hover:border-brand-300' : 'opacity-60 cursor-not-allowed bg-gray-50'}`}
                        onClick={() => addToCart(product)}
                    >
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <Badge color={product.quantity > 5 ? 'green' : product.quantity > 0 ? 'yellow' : 'red'}>
                                {product.quantity}
                            </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 h-9 sm:h-10 leading-tight">{product.name}</h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-1 truncate">{product.sku}</p>
                    </div>
                    <div className="mt-2 sm:mt-3 flex justify-between items-end">
                        <span className="text-base sm:text-lg font-bold text-brand-700">₦{product.price}</span>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${product.quantity > 0 ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-400'}`}>
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    </div>
                ))}
                </div>
                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Search className="w-8 h-8 mb-2 opacity-50" />
                        <p>No products found</p>
                    </div>
                )}
            </div>
          </div>

          {/* Cart & Checkout */}
          <Card className="h-full flex flex-col shadow-lg border-0 overflow-hidden bg-white">
            {/* Customer Banner */}
            <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-100 flex flex-col gap-2 shrink-0">
               <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1 font-medium"><UserCheck className="w-3 h-3" /> Cashier: {user?.name || 'Unknown'}</span>
                  <span>{new Date().toLocaleDateString()}</span>
               </div>
              {selectedCustomer ? (
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 sm:gap-3">
                          <div className="bg-brand-100 p-2 rounded-full text-brand-700">
                              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                              <p className="font-bold text-gray-900 text-sm sm:text-base">{selectedCustomer.name}</p>
                              <p className={`text-xs font-bold ${selectedCustomer.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                  Bal: ₦{selectedCustomer.balance?.toFixed(2) || '0.00'}
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
              ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                       <div className="bg-gray-200 p-2 rounded-full">
                          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                       </div>
                       <p className="text-sm">Walking Customer</p>
                  </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-white max-h-[300px] lg:max-h-none border-b border-gray-100 lg:border-b-0">
              {cart.map(item => (
                <div key={item.productId} className="flex gap-2 sm:gap-3 items-start border-b border-gray-50 pb-3 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 line-clamp-1">{item.productName}</p>
                    <div className="flex items-center gap-2 mt-1">
                         <div className="flex items-center border rounded">
                             <button className="px-2 py-0.5 text-gray-500 hover:bg-gray-100" onClick={() => updateCartItem(item.productId, 'quantity', item.quantity - 1)}>-</button>
                             <input 
                                className="w-8 sm:w-10 text-center text-xs font-semibold outline-none" 
                                value={item.quantity} 
                                onChange={(e) => updateCartItem(item.productId, 'quantity', Number(e.target.value))}
                             />
                             <button className="px-2 py-0.5 text-gray-500 hover:bg-gray-100" onClick={() => updateCartItem(item.productId, 'quantity', item.quantity + 1)}>+</button>
                         </div>
                         <span className="text-xs text-gray-400">x</span>
                         {isAdmin ? (
                             <div className="relative">
                                 <span className="absolute left-1 top-0.5 text-xs text-gray-400">₦</span>
                                 <input 
                                     className="w-14 sm:w-16 border rounded pl-3 py-0.5 text-xs outline-none focus:border-brand-500"
                                     value={item.price}
                                     onChange={(e) => updateCartItem(item.productId, 'price', Number(e.target.value))}
                                 />
                             </div>
                         ) : (
                             <span className="text-sm text-gray-600">₦{item.price}</span>
                         )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">₦{(item.subtotal || 0).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-300 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8 lg:py-0">
                  <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-20" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              )}
            </div>

            {/* Checkout Area */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-3 shrink-0">
              <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                <span>Total</span>
                <span className="text-2xl">₦{cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select 
                    label="PAYMENT METHOD"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Transfer">Bank Transfer</option>
                      <option value="Credit">On Account (Credit)</option>
                  </Select>
                  
                  <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 uppercase text-[10px]">Amount Paid</label>
                      <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 font-bold">₦</span>
                          <input 
                              type="number"
                              className="w-full border border-gray-300 rounded-md p-2 pl-8 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                              value={amountPaid}
                              onChange={(e) => setAmountPaid(e.target.value)}
                              placeholder="0.00"
                          />
                      </div>
                  </div>
              </div>

              {/* Balance/Change Indicator */}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 border-dashed">
                  {Number(amountPaid) >= cartTotal ? (
                      <>
                        <span className="text-gray-500">Change Due:</span>
                        <span className="font-bold text-green-600">₦{changeDue.toFixed(2)}</span>
                      </>
                  ) : (
                      <>
                        <span className="text-gray-500">Balance (To Ledger):</span>
                        <span className="font-bold text-red-500">₦{balanceDue.toFixed(2)}</span>
                      </>
                  )}
              </div>

              <Button 
                className="w-full py-3 text-lg shadow-lg shadow-brand-100" 
                onClick={handleCheckout} 
                disabled={cart.length === 0}
              >
                Confirm Sale
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-0 sm:p-6 overflow-hidden">
          <div className="p-4 sm:p-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Sales History</h2>
            <div className="w-full md:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input 
                placeholder="Search ID, customer, or staff..." 
                className="pl-10 w-full"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table headers={['Sale ID', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Method', 'Sold By']}>
                {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{sale.id.slice(-6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 min-w-[200px]">
                    <div className="flex flex-col">
                        {sale.items.map((i, idx) => (
                            <span key={idx} className="text-xs truncate">{i.quantity}x {i.productName}</span>
                        ))}
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₦{sale.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₦{sale.amountPaid ? sale.amountPaid.toFixed(2) : sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={sale.paymentMethod === 'Credit' ? 'red' : 'green'}>{sale.paymentMethod || 'N/A'}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-indigo-600">{sale.initiatedByName}</span>
                    </div>
                    </td>
                </tr>
                ))}
            </Table>
          </div>
          {filteredSales.length === 0 && <p className="text-center py-12 text-gray-400 italic">No sales found matching your criteria.</p>}
        </Card>
      )}
    </div>
  );
};