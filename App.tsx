import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { firebaseConfig } from './firebase';
import { Role } from './types';

// --- Page Components ---
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard'; 
import { Inventory } from './components/Inventory';
import { Stock } from './components/Stock';
import { Sales } from './components/Sales';
import { CompanyExpenses } from './components/CompanyExpenses';
import { BankDeposit } from './components/BankDeposit';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { StaffManagement } from './components/StaffManagement';
import Settings from './components/Settings';
import { Customers, Suppliers } from './components/Customers'; // Added Suppliers here
import { CustomerLedger } from './components/CustomerLedger';
import { SupplierLedger } from './components/SupplierLedger';

// --- Icons ---
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
    Briefcase
} from 'lucide-react';

// =================================================================================
// --- Utility Components ---
// =================================================================================

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
                    <p className="text-sm font-medium">The application is running with a placeholder API key. You must connect it to your Firebase project to proceed.</p>
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
                        <li className="pl-2">Replace values in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 text-xs">firebase.ts</code>.</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
);

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

    useEffect(() => {
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

        if (urlEmail && urlName) {
            try {
                setEmail(atob(urlEmail));
                setName(decodeURIComponent(escape(atob(urlName))));
                setStatus('VALID');
                return;
            } catch (e) { console.warn("Failed to decode params", e); }
        }

        validateInvitation(urlToken)
            .then((invite: any) => {
                setEmail(invite.email);
                setName(invite.name);
                setStatus('VALID');
            })
            .catch(() => setStatus('INVALID'));
    }, [validateInvitation, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (password !== confirmPassword) { setError("Passwords do not match"); return; }
        if (password.length < 6) { setError("Password too short"); return; }
        
        setIsSubmitting(true);
        try {
            await acceptInvitation(token, password, email, name);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || "Failed to complete registration.");
            setIsSubmitting(false);
        }
    };

    if (user) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
                <UserIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Already Logged In</h2>
                <p className="text-slate-500 mb-6">Log out to accept a new invitation.</p>
                <button onClick={() => logout()} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl mb-3">Sign Out</button>
                <button onClick={() => window.location.href='/dashboard'} className="w-full py-3 bg-slate-100 rounded-xl">Dashboard</button>
            </div>
        </div>
    );

    if (status === 'LOADING') return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (status === 'INVALID') return <div className="h-screen flex items-center justify-center p-4 text-center"><div>Invalid Link</div></div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center text-white">
                    <CheckCircle className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Welcome, {name.split(' ')[0]}!</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
                    <input type="email" disabled value={email} className="w-full p-2.5 bg-slate-50 border rounded-lg" />
                    <input type="password" placeholder="Set Password" required className="w-full p-2.5 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} />
                    <input type="password" placeholder="Confirm Password" required className="w-full p-2.5 border rounded-lg" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl flex justify-center items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <>Complete Setup <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Layout Component ---

const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, products, logout } = useApp();
    const isAdmin = user?.role === Role.ADMIN;
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
  
    const lowStockCount = products.filter((p: any) => p.quantity <= p.minStockLevel).length;
    const rolePrefix = isAdmin ? '/admin' : '/staff';

    const menuItems = [
      { name: "Dashboard", href: `${rolePrefix}/dashboard`, icon: <LayoutDashboard className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
      { type: 'header', label: 'Operations' },
      { name: "Sales POS", href: `${rolePrefix}/sales`, icon: <ShoppingCart className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
      { name: "Inventory", href: "/admin/inventory", icon: <Package className="w-5 h-5" />, roles: [Role.ADMIN] },
      { name: "Stock Control", href: `${rolePrefix}/stock`, icon: <ClipboardList className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF], badge: lowStockCount },
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
  
    const filteredItems = menuItems.filter(item => {
        if (item.type === 'header') return true; 
        return item.roles?.includes(user?.role || Role.STAFF);
    });
  
    const getPageTitle = () => {
      const segment = location.pathname.split('/').pop();
      return segment ? segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Dashboard';
    };
  
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform md:translate-x-0 md:static flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-20 flex items-center gap-3 px-6 border-b">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><ShoppingCart className="w-6 h-6" /></div>
             <h1 className="font-bold text-xl">Jireh Fishes</h1>
          </div>
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {filteredItems.map((item: any, idx) => (
                item.type === 'header' ? 
                <p key={idx} className="px-4 mt-6 mb-2 text-xs font-bold text-slate-400 uppercase">{item.label}</p> :
                <button key={idx} onClick={() => { navigate(item.href); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.href ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {item.icon} <span className="flex-1 text-left text-sm">{item.name}</span>
                    {item.badge > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{item.badge}</span>}
                </button>
              ))}
          </div>
          <div className="p-4 border-t bg-slate-50">
             <div className="flex items-center gap-3 mb-4">
                <UserIcon className="w-8 h-8 p-1 bg-white rounded-full border" />
                <div className="min-w-0"><p className="text-sm font-bold truncate">{user?.name}</p><p className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase()}</p></div>
             </div>
             <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 bg-white border rounded-xl hover:text-red-600 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
          </div>
        </aside>
  
        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          <header className="bg-white/80 border-b px-8 h-20 flex items-center justify-between sticky top-0 z-30">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2"><Menu /></button>
            <h2 className="text-xl font-bold">{getPageTitle()}</h2>
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/settings')} className="p-2 text-slate-400 hover:text-indigo-600"><SettingsIcon className="w-5 h-5" /></button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    );
};

// --- Auth Guards ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) return null;
    if (user) return <Navigate to={user.role === Role.ADMIN ? "/admin/dashboard" : "/staff/dashboard"} replace />;
    return <>{children}</>;
};

// --- Routes Tree ---

export const AppRoutes = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const goBack = () => navigate(user?.role === Role.ADMIN ? '/admin/dashboard' : '/staff/dashboard');
    const dashboardTarget = user?.role === Role.ADMIN ? "/admin/dashboard" : "/staff/dashboard";

    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/join" element={<AcceptInviteScreen />} />
            <Route path="/setup" element={<SetupScreen />} />
            <Route path="/*" element={
                <ProtectedRoute>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to={dashboardTarget} replace />} />
                            <Route path="admin/dashboard" element={<Dashboard onNavigate={(p) => navigate(p === 'sales' ? '/admin/sales' : `/admin/${p}`)} />} />
                            <Route path="staff/dashboard" element={<Dashboard onNavigate={(p) => navigate(p === 'sales' ? '/staff/sales' : `/staff/${p}`)} />} />
                            <Route path="admin/sales" element={<Sales />} />
                            <Route path="staff/sales" element={<Sales />} />
                            <Route path="admin/inventory" element={<Inventory onBack={goBack} />} />
                            <Route path="admin/stock" element={<Stock onBack={goBack} />} />
                            <Route path="staff/stock" element={<Stock onBack={goBack} />} />
                            <Route path="admin/staff-management" element={<StaffManagement onBack={goBack} />} />
                            <Route path="admin/company-expenses" element={<CompanyExpenses />} />
                            <Route path="admin/bank-deposit" element={<BankDeposit />} />
                            <Route path="admin/payroll" element={<Payroll />} />
                            <Route path="admin/customers" element={<Customers onBack={goBack} onViewLedger={() => navigate('/admin/customer-ledger')} />} />
                            <Route path="staff/customers" element={<Customers onBack={goBack} onViewLedger={() => navigate('/staff/customer-ledger')} />} />
                            <Route path="admin/customer-ledger" element={<CustomerLedger onBack={() => navigate('/admin/customers')} />} />
                            <Route path="staff/customer-ledger" element={<CustomerLedger onBack={() => navigate('/staff/customers')} />} />
                            <Route path="admin/suppliers" element={<Suppliers onBack={goBack} onViewLedger={() => navigate('/admin/supplier-ledger')} />} />
                            <Route path="admin/supplier-ledger" element={<SupplierLedger onBack={() => navigate('/admin/suppliers')} />} />
                            <Route path="admin/reports" element={<Reports />} />
                            <Route path="staff/reports" element={<Reports />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to={dashboardTarget} replace />} />
                        </Routes>
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
};

export const App = () => {
    const needsSetup = firebaseConfig.apiKey.includes("YOUR_API_KEY_HERE");
    return (
        <BrowserRouter>
            {needsSetup ? <SetupScreen /> : (
                <AppProvider>
                    <AppRoutes />
                </AppProvider>
            )}
        </BrowserRouter>
    );
}; 