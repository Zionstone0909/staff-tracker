import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  User, 
  X,
  ChevronRight,
  Package,
  DollarSign,
  Briefcase,
  Users,
  FileText,
  CreditCard,
  Settings,
  Truck,
  BookOpen
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Role } from '../types';

export const Layout = () => {
  const { user, products, logout } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

  // Consolidated Navigation Config
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { type: 'header', label: 'Operations' },
    { name: "Sales POS", href: "/admin/sales", icon: <ShoppingCart className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Inventory", href: "/admin/inventory", icon: <Package className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Stock Control", href: "/admin/stock", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN], badge: lowStockProducts.length },
    { name: "Inventory Check", href: "/staff/stock", icon: <Package className="w-5 h-5" />, roles: [Role.STAFF] },
    
    { type: 'header', label: 'Relationships' },
    { name: "Customers", href: "/admin/customers", icon: <Users className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Customer Ledger", href: "/admin/customer-ledger", icon: <BookOpen className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Suppliers", href: "/admin/suppliers", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Supplier Ledger", href: "/admin/supplier-ledger", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN] },

    { type: 'header', label: 'Finance' },
    { name: "Expenses", href: "/admin/company-expenses", icon: <DollarSign className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Bank Deposits", href: "/admin/bank-deposit", icon: <Briefcase className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Payroll", href: "/admin/payroll", icon: <CreditCard className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Reports", href: "/admin/reports", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.type === 'header') return true;
    return item.roles?.includes(user?.role || Role.STAFF);
  });

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'Dashboard';
    const segment = location.pathname.split('/').pop();
    return segment ? segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0 flex flex-col shadow-xl md:shadow-none`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
              <ShoppingCart className="w-6 h-6" />
           </div>
           <div>
              <h1 className="font-bold text-xl text-slate-900 leading-none tracking-tight">Jireh Fishes</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Retail Manager</p>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto p-2 text-slate-400 hover:text-slate-600 rounded-lg">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredItems.map((item: any, index) => {
              if (item.type === 'header') {
                return (
                  <div key={index} className="px-4 mt-6 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              }

              // Active state logic: Exact match or starts with href (for nested routes)
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              
              return (
                <button 
                  key={index}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left text-sm">{item.name}</span>
                  
                  {item.badge > 0 && (
                     <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full shadow-sm animate-pulse">
                        {item.badge}
                     </span>
                  )}
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />}
                </button>
              );
            })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-slate-700 font-bold overflow-hidden">
                 <User className="w-6 h-6 bg-slate-100 p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {user?.role.toLowerCase()}
                </p>
              </div>
           </div>
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm"
           >
             <LogOut className="w-4 h-4" /> 
             <span className="text-sm">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 h-20 flex items-center justify-between shrink-0 transition-all">
          <div className="max-w-7xl w-full mx-auto flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
               <Menu className="w-6 h-6" />
             </button>
             <div>
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {getPageTitle()}
               </h2>
               <p className="hidden md:block text-xs text-slate-500">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-semibold">System Active</span>
             </div>
             <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative">
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-300">
           <div className="max-w-7xl w-full mx-auto">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};