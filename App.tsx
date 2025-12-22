import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { firebaseConfig } from './firebase';
import { Role } from './types';
import Settings from './components/Settings';
import { Customers, Suppliers } from './components/Customers';
import { CustomerLedger } from './components/CustomerLedger';
import { SupplierLedger } from './components/SupplierLedger';
import { LoginPage } from './components/LoginPage';

// --- Imports ---
import { Dashboard } from './components/Dashboard'; 
import { Inventory } from './components/Inventory';
import { Stock } from './components/Stock';
import { Sales } from './components/Sales';
import { CompanyExpenses } from './components/CompanyExpenses';
import { BankDeposit } from './components/BankDeposit';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { StaffManagement } from './components/StaffManagement';

import { 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    ClipboardList, 
    Users, 
    BookOpen, 
    Truck, 
    FileText, 
    DollarSign, 
    Landmark, 
    CreditCard, 
    BarChart3, 
    Settings as SettingsIcon, 
    LogOut, 
    AlertTriangle, 
    FileText as FileIcon,
    CheckCircle,
    Loader2,
    Lock,
    Mail,
    User as UserIcon,
    ArrowRight,
    Menu,
    X,
    Briefcase,
    ChevronRight
} from 'lucide-react';

// =================================================================================
// --- Utility Components (SetupScreen, AcceptInviteScreen, Layout, Guards) ---
// =================================================================================

// --- Setup Screen Component ---
const SetupScreen = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Configuration Required</h1>
                    <p className="text-indigo-100 opacity-90">Jireh Fishes Inventory System</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <div className="p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">The application is running with a placeholder API key.
                    You must connect it to your Firebase project to proceed.</p>
                </div>
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileIcon className="w-5 h-5 text-slate-400" />
                        Step-by-Step Instructions:
                    </h3>
                    <ol className="list-decimal list-inside space-y-3 text-slate-600 ml-1 text-sm">
                        <li className="pl-2">Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">Firebase Console</a>.</li>
                        <li className="pl-2">Navigate to <span className="font-semibold text-slate-800">Project Settings</span>.</li>
                        <li className="pl-2">Copy the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 text-xs">firebaseConfig</code> object.</li>
                        <li className="pl-2">Replace the placeholder values in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 text-xs">firebase.ts</code>.</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
);

// Accept Invite Component
const AcceptInviteScreen = () => {
    const { acceptInvitation, validateInvitation, logout, user } = useApp();
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'LOADING' | 'VALID' | 'INVALID'>('LOADING');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Invite Validation Effect
    useEffect(() => {
        // If user is logged in, we skip validation logic here and show the "Logged In" screen in render
        if (user) return;
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const urlEmail = params.get('e');
        const urlName = params.get('n');
        if (!urlToken) {
            setStatus('INVALID');
            return;
        }
        setToken(urlToken);
        // Optimistically use URL params for display to prevent offline blocking
        if (urlEmail && urlName) {
            try {
                setEmail(atob(urlEmail));
                setName(decodeURIComponent(escape(atob(urlName))));
                setStatus('VALID');
                return;
            } catch (e) {
                console.warn("Failed to decode params", e);
            }
        }
        // Fallback: Validate against DB
        let isMounted = true;
        validateInvitation(urlToken)
            .then((invite: any) => {
                if (isMounted) {
                    setEmail(invite.email);
                    setName(invite.name);
                    setStatus('VALID');
                }
            })
            .catch((err: any) => {
                console.error("Validation error:", err);
                if (isMounted) {
                    setStatus('INVALID');
                }
            });

        return () => { isMounted = false; };
    }, [validateInvitation, user]); 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setIsSubmitting(true);
        try {
            await acceptInvitation(token, password, email, name);
            window.location.href = '/dashboard';
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("offline")) {
                setError("Network error: Unable to verify invitation. Please check your internet connection.");
            } else {
                setError(err.message || "Failed to complete registration.");
            }
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Already Logged In</h2>
                    <p className="text-slate-500 mb-6">
                        You are currently logged in as <strong>{user.name}</strong>. To accept this invitation, you must sign out first.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => logout()}
                            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition"
                        >
                            Sign Out
                        </button>
                        <a
                            href="/dashboard"
                            className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                        >
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'LOADING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">Validating Invitation...</h2>
                    <p className="text-slate-500 mt-2">Please wait while we check your secure link.</p>
                </div>
            </div>
        );
    }

    if (status === 'INVALID') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid or Expired Link</h2>
                    <p className="text-slate-500 mb-6">
                        This invitation link is invalid, expired, or you do not have permission to view it.
                        Please request a new link from your administrator.
                    </p>
                    <a href="/login" className="inline-block px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">
                        Back to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome, {name.split(' ')[0]}!</h2>
                    <p className="text-indigo-100 text-sm mt-1">Complete your account setup for Jireh Fishes</p>
                </div>
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="email"
                                    disabled
                                    value={email}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-medium"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Set Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Min. 6 characters"
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Re-enter password"
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Complete Setup <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Layout & Navigation ---
const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, products, logout } = useApp();
    const isAdmin = user?.role === Role.ADMIN;
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
  
    const lowStockProducts = products.filter((p: any) => p.quantity <= p.minStockLevel);
    const rolePrefix = isAdmin ? '/admin' : '/staff';

    // Consolidated Navigation Config
    const menuItems = [
      { name: "Dashboard", href: `${rolePrefix}/dashboard`, icon: <LayoutDashboard className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
      { type: 'header', label: 'Operations' },
      { name: "Sales POS", href: `${rolePrefix}/sales`, icon: <ShoppingCart className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
      { name: "Inventory", href: "/admin/inventory", icon: <Package className="w-5 h-5" />, roles: [Role.ADMIN] },
      { name: "Stock Control", href: `${rolePrefix}/stock`, icon: <ClipboardList className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF], badge: lowStockProducts.length },
      
      { type: 'header', label: 'Relationships' },
      { name: "Customers", href: `${rolePrefix}/customers`, icon: <Users className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
      { name: "Customer Ledger", href: `${rolePrefix}/customer-ledger`, icon: <BookOpen className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
      { name: "Suppliers", href: "/admin/suppliers", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN] },
      { name: "Supplier Ledger", href: "/admin/supplier-ledger", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN] },
  
      { type: 'header', label: 'Finance' },
      { name: "Expenses", href: "/admin/company-expenses", icon: <DollarSign className="w-5 h-5" />, roles: [Role.ADMIN] },
      { name: "Bank Deposits", href: "/admin/bank-deposit", icon: <Briefcase className="w-5 h-5" />, roles: [Role.ADMIN] },
      { name: "Payroll", href: "/admin/payroll", icon: <CreditCard className="w-5 h-5" />, roles: [Role.ADMIN] },
      { name: "Reports", href: `${rolePrefix}/reports`, icon: <BarChart3 className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    ];
  
    const filteredItems = menuItems.filter((item, index, array) => {
        if (item.type === 'header') {
            // Look ahead for items until next header
            let hasVisibleChildren = false;
            for (let i = index + 1; i < array.length; i++) {
                if (array[i].type === 'header') break;
                if (array[i].roles?.includes(user?.role || Role.STAFF)) {
                    hasVisibleChildren = true;
                    break;
                }
            }
            return hasVisibleChildren;
        }
        return item.roles?.includes(user?.role || Role.STAFF);
    });
  
    const getPageTitle = () => {
      if (location.pathname === '/' || location.pathname.includes('/dashboard')) return 'Dashboard';
      const segment = location.pathname.split('/').pop();
      return segment ? segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Dashboard';
    };
  
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
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
  
                // Active state logic
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
                   <UserIcon className="w-6 h-6 bg-slate-100 p-1" />
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
            <div className="flex items-center gap-4">
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
               <button 
                  onClick={() => navigate('/settings')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative"
               >
                  <SettingsIcon className="w-5 h-5" />
               </button>
            </div>
          </header>
  
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-300">
             {children}
          </main>
        </div>
      </div>
    );
};

// --- Routes & Auth Guards ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    if (!user) { 
        return <Navigate to="/login" replace />; 
    }
    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) return null;
    if (user) { 
        // Role-based redirect
        const target = user.role === Role.ADMIN ? "/admin/dashboard" : "/staff/dashboard";
        return <Navigate to={target} replace />; 
    }
    return <>{children}</>;
};


export const AppRoutes = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    
    // Helper for props driven navigation 
    const goBack = () => navigate(user?.role === Role.ADMIN ? '/admin/dashboard' : '/staff/dashboard');

    // Determine dashboard target based on role
    const dashboardTarget = user?.role === Role.ADMIN ? "/admin/dashboard" : "/staff/dashboard";

    return (
        <Routes>
            <Route path="/login" element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            } />
            {/* Explicit Route for Invite Handling */}
            <Route path="/join" element={<AcceptInviteScreen />} />

            {/* Fallback for API Key missing */}
            <Route path="/setup" element={<SetupScreen />} />

            {/* Main Application Protected Routes */}
            <Route path="/*" element={
                <ProtectedRoute>
                    <Layout>
                        <Routes>
                            {/* Default Redirect to Role Dashboard */}
                            <Route path="/" element={<Navigate to={dashboardTarget} replace />} />

                            {/* Role Specific Dashboards */}
                            <Route path="admin/dashboard" element={<Dashboard onNavigate={(path: string) => navigate(path === 'sales' ? '/admin/sales' : `/admin/${path}`)} />} />
                            <Route path="staff/dashboard" element={<Dashboard onNavigate={(path: string) => navigate(path === 'sales' ? '/staff/sales' : `/staff/${path}`)} />} />
                            
                            {/* POS Module */}
                            <Route path="admin/sales" element={<Sales />} />
                            <Route path="staff/sales" element={<Sales />} />

                            {/* Inventory & Stock */}
                            <Route path="admin/inventory" element={<Inventory onBack={goBack} />} />
                            <Route path="admin/stock" element={<Stock onBack={goBack} />} />
                            <Route path="staff/stock" element={<Stock onBack={goBack} />} />

                            {/* Admin-Only Modules */}
                            <Route path="admin/staff-management" element={<StaffManagement onBack={goBack} />} />
                            <Route path="admin/company-expenses" element={<CompanyExpenses />} />
                            <Route path="admin/bank-deposit" element={<BankDeposit />} />
                            <Route path="admin/payroll" element={<Payroll />} />
                            
                            {/* Customers (Shared) */}
                            <Route path="admin/customers" element={<Customers onBack={goBack} onViewLedger={() => navigate('/admin/customer-ledger')} />} />
                            <Route path="staff/customers" element={<Customers onBack={goBack} onViewLedger={() => navigate('/staff/customer-ledger')} />} />
                            <Route path="admin/customer-ledger" element={<CustomerLedger onBack={() => navigate('/admin/customers')} />} />
                            <Route path="staff/customer-ledger" element={<CustomerLedger onBack={() => navigate('/staff/customers')} />} />
                            
                            {/* Suppliers (Admin-Only) */}
                            <Route path="admin/suppliers" element={<Suppliers onBack={goBack} />} />
                            <Route path="admin/supplier-ledger" element={<SupplierLedger onBack={() => navigate('/admin/suppliers')} />} />

                            {/* Reports (Shared) */}
                            <Route path="admin/reports" element={<Reports />} />
                            <Route path="staff/reports" element={<Reports />} />
                            
                            {/* Settings (Shared) */}
                            <Route path="settings" element={<Settings />} />
                            
                            {/* Fallbacks */}
                            <Route path="*" element={<Navigate to={dashboardTarget} replace />} />
                        </Routes>
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
};

export const App = () => {
    // Check if Firebase config is placeholder to force setup screen
    const needsSetup = firebaseConfig.apiKey.includes("YOUR_API_KEY_HERE");

    return (
        <BrowserRouter>
            {needsSetup ? (
                // Only show setup screen if config is missing
                <SetupScreen />
            ) : (
                // Wrap routes with the AppProvider if config is valid
                <AppProvider>
                    <AppRoutes />
                </AppProvider>
            )}
        </BrowserRouter>
    );
};