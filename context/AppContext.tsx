import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    User, Role, Product, Sale, Log, Customer, Supplier,
    SupplierTransaction, Expense, StockMovement, PayrollEntry, Invitation
} from '../types';
import { auth, db } from '../firebase';
import { BackendService } from '../services/BackendService'; // Assuming this service exists
import ApiClient from '../services/ApiClient';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    updateDoc,
    increment,
    writeBatch,
    runTransaction,
    serverTimestamp,
    DocumentSnapshot
} from 'firebase/firestore';

// --------------------------------------------------------------------------------
// 1. Types and Context Definition
// --------------------------------------------------------------------------------
interface AppContextType {
    user: User | null;
    loading: boolean;

    // Data State
    users: User[];
    products: Product[];
    sales: Sale[];
    logs: Log[];
    customers: Customer[];
    suppliers: Supplier[];
    supplierTransactions: SupplierTransaction[];
    expenses: Expense[];
    stockMovements: StockMovement[];
    payroll: PayrollEntry[];
    invitations: Invitation[];

    // Auth Actions
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role: Role) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (name: string) => Promise<void>;
    toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;

    // Invitation/Staff Management Actions
    createInvitation: (name: string, email: string, role: Role) => Promise<string>;
    revokeInvitation: (token: string) => Promise<void>;
    acceptInvitation: (token: string, password: string, emailHint?: string, nameHint?: string) => Promise<void>;
    validateInvitation: (token: string) => Promise<Invitation>;
    fetchLastInvitation: () => Promise<Invitation | null>;


    // Business Logic Actions
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    updateProductStock: (id: string, qtyChange: number) => Promise<void>;
    addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    receiveStock: (supplierId: string, items: { productId: string; quantity: number; cost: number }[]) => Promise<void>;
    addSupplierPayment: (transaction: Omit<SupplierTransaction, 'id' | 'type' | 'items'> & { paymentMethod?: string }) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    addPayroll: (entry: Omit<PayrollEntry, 'id'>) => Promise<void>;
    adjustStock: (productId: string, quantity: number, type: StockMovement['type'], reason: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --------------------------------------------------------------------------------
// 2. AppProvider Component
// --------------------------------------------------------------------------------
export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Data Collections State
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);

    // --- Helper: Add Log (uses local API stub) ---
    const addLog = useCallback(async (action: string, details: string) => {
        if (!user) return;
        try {
            const entry = await ApiClient.post('/api/logs', {
                action,
                details,
                timestamp: new Date().toISOString(),
                userId: user.id || 'system',
                userName: user.name || 'System',
            });
            setLogs(prev => [entry, ...prev]);
        } catch (e) {
            console.error('Failed to add log', e);
        }
    }, [user]); // Depend on user for context

    // 1. Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const isAdminEmail = firebaseUser.email === 'hannahakanni7@gmail.com'; // Admin definition

                    // Race condition helper: Fail if Firestore takes > 3s (offline/latency)
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Firestore timeout')), 3000)
                    );

                    try {
                        const userDocRef = doc(db, 'users', firebaseUser.uid);
                        const snapshot = (await Promise.race([
                            getDoc(userDocRef),
                            timeoutPromise
                        ])) as DocumentSnapshot;

                        if (snapshot.exists()) {
                            const userData = { id: snapshot.id, ...snapshot.data() } as User;
                            if (userData.isActive === false) {
                                // If caught here, we just sign out. The login function handles the UI feedback.
                                await signOut(auth);
                                setUser(null);
                            } else {
                                // Force local admin role if email matches
                                if (isAdminEmail) userData.role = Role.ADMIN;
                                
                                // Sync Role to Firestore if it doesn't match (Fixes permission issues)
                                if (isAdminEmail && snapshot.data()?.role !== Role.ADMIN) {
                                    await updateDoc(userDocRef, { role: Role.ADMIN });
                                    userData.role = Role.ADMIN;
                                }

                                setUser(userData);
                            }
                        } else {
                            // First time user or missing doc
                            const newUser = {
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || 'User',
                                email: firebaseUser.email!,
                                role: isAdminEmail ? Role.ADMIN : Role.STAFF,
                                isActive: true,
                                createdAt: new Date().toISOString()
                            };
                            
                            // Create the user doc immediately to ensure rules work
                            await setDoc(userDocRef, newUser);
                            setUser(newUser);
                        }
                    } catch (fetchError) {
                        console.warn("Firestore profile fetch failed or timed out (Offline mode active):", fetchError);
                        // Fallback for offline mode, uses basic Firebase user info
                        setUser({
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || 'Offline User',
                            email: firebaseUser.email!,
                            role: isAdminEmail ? Role.ADMIN : Role.STAFF,
                            isActive: true
                        });
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    // 2. Data Loading (from local API stubs)
    useEffect(() => {
        if (!user) {
            setProducts([]);
            setSales([]);
            setLogs([]);
            setCustomers([]);
            setSuppliers([]);
            setSupplierTransactions([]);
            setExpenses([]);
            setStockMovements([]);
            setPayroll([]);
            setUsers([]);
            setInvitations([]);
            return;
        }

        let cancelled = false;
        const loadAll = async () => {
            try {
                const [productsData, salesData, logsData, customersData, suppliersData, suppTxData, expensesData, stockData, payrollData, usersData, invitationsData] = await Promise.all([
                    ApiClient.get('/api/products'),
                    ApiClient.get('/api/sales'),
                    ApiClient.get('/api/logs'),
                    ApiClient.get('/api/customers'),
                    ApiClient.get('/api/suppliers'),
                    ApiClient.get('/api/supplierTransactions'),
                    ApiClient.get('/api/expenses'),
                    ApiClient.get('/api/inventory'),
                    ApiClient.get('/api/payroll'),
                    ApiClient.get('/api/users'),
                    ApiClient.get('/api/invitations')
                ]);

                if (cancelled) return;

                setProducts(productsData || []);
                setSales(salesData || []);
                setLogs(logsData || []);
                setCustomers(customersData || []);
                setSuppliers(suppliersData || []);
                setSupplierTransactions(suppTxData || []);
                setExpenses(expensesData || []);
                setStockMovements(stockData || []);
                setPayroll(payrollData || []);
                setUsers(usersData || []);
                // Only show invitations for admins
                setInvitations(user.role === Role.ADMIN ? (invitationsData || []) : []);

                // Persist a local cache so UI remains available when server is unreachable
                try {
                    localStorage.setItem('app.products', JSON.stringify(productsData || []));
                    localStorage.setItem('app.sales', JSON.stringify(salesData || []));
                    localStorage.setItem('app.logs', JSON.stringify(logsData || []));
                    localStorage.setItem('app.customers', JSON.stringify(customersData || []));
                    localStorage.setItem('app.suppliers', JSON.stringify(suppliersData || []));
                    localStorage.setItem('app.supplierTransactions', JSON.stringify(suppTxData || []));
                    localStorage.setItem('app.expenses', JSON.stringify(expensesData || []));
                    localStorage.setItem('app.stockMovements', JSON.stringify(stockData || []));
                    localStorage.setItem('app.payroll', JSON.stringify(payrollData || []));
                    localStorage.setItem('app.users', JSON.stringify(usersData || []));
                    localStorage.setItem('app.invitations', JSON.stringify(invitationsData || []));
                } catch (lsErr) {
                    console.warn('Failed to persist app data to localStorage:', lsErr);
                }
            } catch (err) {
                console.error('Error loading API data:', err);

                // Fallback: load from localStorage cache so UI keeps showing history when server is down
                try {
                    const loadKey = <T,>(k: string): T[] => {
                        const raw = localStorage.getItem(k);
                        return raw ? JSON.parse(raw) as T[] : [];
                    };

                    setProducts(loadKey('app.products'));
                    setSales(loadKey('app.sales'));
                    setLogs(loadKey('app.logs'));
                    setCustomers(loadKey('app.customers'));
                    setSuppliers(loadKey('app.suppliers'));
                    setSupplierTransactions(loadKey('app.supplierTransactions'));
                    setExpenses(loadKey('app.expenses'));
                    setStockMovements(loadKey('app.stockMovements'));
                    setPayroll(loadKey('app.payroll'));
                    setUsers(loadKey('app.users'));
                    setInvitations(user.role === Role.ADMIN ? loadKey('app.invitations') : []);
                } catch (lsErr) {
                    console.warn('Failed to load fallback data from localStorage:', lsErr);
                }
            }
        };

        loadAll();

        return () => { cancelled = true; };
    }, [user?.id, user?.role]);

    // --------------------------------------------------------------------------------
    // 3. Auth Actions
    // --------------------------------------------------------------------------------
    const login = useCallback(async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', cred.user.uid);

        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData?.isActive === false) {
                    await signOut(auth);
                    throw new Error("Account is suspended.");
                }
                // Fire and forget log
                addLog('LOGIN', `User logged in from web`).catch(console.error);
            }
        } catch (e: any) {
            if (e.message === "Account is suspended.") throw e;
            console.warn("Login profile check skipped (offline)", e);
        }
    }, [addLog]);

    const register = useCallback(async (name: string, email: string, password: string, role: Role) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = {
            id: res.user.uid,
            name,
            email,
            role,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', res.user.uid), newUser);
        addLog('REGISTER', `New user registered: ${name} (${role})`).catch(console.error);
    }, [addLog]);

    const resetPassword = useCallback(async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
        // Clear local storage items related to invites/state
        sessionStorage.removeItem('cim_invite_link');
        sessionStorage.removeItem('cim_invite_name');
        sessionStorage.removeItem('cim_invite_email');
        // Note: we intentionally DO NOT clear local app cache here so history remains available offline.
    }, []);
    
    const updateUserProfile = useCallback(async (name: string) => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.id), { name });
        setUser(prev => prev ? { ...prev, name } : null);
        addLog('PROFILE_UPDATE', `User updated profile name to: ${name}`).catch(console.error);
    }, [user, addLog]);

    const toggleUserStatus = useCallback(async (userId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        await updateDoc(doc(db, 'users', userId), {
            isActive: newStatus
        });
        addLog('USER_STATUS', `Changed user ${userId} status to ${newStatus ? 'Active' : 'Suspended'}`).catch(console.error);
    }, [addLog]);


    // --------------------------------------------------------------------------------
    // 4. Invitation/Staff Management Actions
    // --------------------------------------------------------------------------------
    const createInvitation = useCallback(async (name: string, email: string, role: Role) => {
        if (!user || user.role !== Role.ADMIN) throw new Error("Only admins can invite staff.");

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const inviteData: Invitation = {
            token,
            email,
            name,
            role,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            createdBy: user.id
        };

        const created = await ApiClient.post('/api/invitations', inviteData);
        setInvitations(prev => [created, ...prev]);
        addLog('INVITE_CREATE', `Created invitation for ${email} as ${role}`).catch(console.error);

        const params = new URLSearchParams({
            token,
            e: btoa(email),
            n: btoa(unescape(encodeURIComponent(name)))
        });

        return `${window.location.origin}/join?${params.toString()}`;
    }, [user, addLog]);

    const revokeInvitation = useCallback(async (token: string) => {
        // Remove locally (stub server does not implement delete)
        setInvitations(prev => prev.filter(i => i.token !== token));
        addLog('INVITE_REVOKE', `Revoked invitation token ${token.substring(0, 8)}...`).catch(console.error);
    }, [addLog]);

    const validateInvitation = useCallback(async (token: string): Promise<Invitation> => {
        const invitationsList = await ApiClient.get('/api/invitations');
        const found = invitationsList.find((i: Invitation) => i.token === token);
        if (!found) throw new Error('Invalid invitation code.');
        if (found.status === 'USED') throw new Error('This invitation has already been used.');
        return found;
    }, []);

    const acceptInvitation = useCallback(async (token: string, password: string, emailHint?: string, nameHint?: string) => {
        if (!emailHint) {
            try {
                const docRef = doc(db, 'invitations', token);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const invite = snapshot.data() as Invitation;
                    emailHint = invite.email;
                    nameHint = invite.name;
                } else {
                    throw new Error("Unable to validate invite.");
                }
            } catch (e) {
                throw new Error("Unable to validate invite before registration. Please ensure you are using the full link provided.");
            }
        }
        
        let cred;
        try {
            // 1. Create Firebase Auth User
            cred = await createUserWithEmailAndPassword(auth, emailHint, password);
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-in-use') {
                throw new Error("This email is already registered. Please login instead.");
            }
            throw authError;
        }

        try {
            const docRef = doc(db, 'invitations', token);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) throw new Error("Invalid invitation code.");
            const invite = snapshot.data() as Invitation;

            if (invite.email.toLowerCase() !== emailHint!.toLowerCase()) {
                throw new Error("Invite email does not match registration email.");
            }

            // 2. Create Firestore User and Delete Invitation (Atomic Batch)
            const newUser: User = {
                id: cred.user.uid,
                name: invite.name,
                email: invite.email,
                role: invite.role,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            const batch = writeBatch(db);
            batch.set(doc(db, 'users', cred.user.uid), newUser);
            batch.delete(doc(db, 'invitations', token));
            
            // Log action
            const logRef = doc(collection(db, 'logs'));
            batch.set(logRef, {
                action: 'INVITE_ACCEPT',
                details: `Staff member joined: ${invite.name} (${invite.email})`,
                timestamp: new Date().toISOString(),
                userId: cred.user.uid,
                userName: invite.name,
            });

            await batch.commit();

        } catch (error: any) {
            // Clean up: Delete Firebase user if Firestore failed
            if (auth.currentUser) {
                await auth.currentUser.delete().catch(console.error);
            }
            await signOut(auth);
            throw error;
        }
    }, []);

    const fetchLastInvitation = useCallback(async () => {
        if (!user) return null;
        const list = await ApiClient.get('/api/invitations');
        const pending = list.filter((i: Invitation) => i.createdBy === user.id && i.status === 'PENDING')
            .sort((a: Invitation, b: Invitation) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return pending.length > 0 ? pending[0] : null;
    }, [user]);


    // --------------------------------------------------------------------------------
    // 5. Business Logic Actions
    // --------------------------------------------------------------------------------

    // Stock Management Helpers
    const adjustStock = useCallback(async (productId: string, quantity: number, type: StockMovement['type'], reason: string) => {
        try {
            // Update local product quantity
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, quantity: (p.quantity || 0) + quantity } : p));

            // Log the stock movement to the API
            const movement = await ApiClient.post('/api/inventory', {
                productId,
                productName: products.find(p => p.id === productId)?.name || 'Unknown',
                type,
                quantity,
                reason,
                date: new Date().toISOString(),
                userId: user?.id || 'system',
                userName: user?.name || 'System'
            });
            setStockMovements(prev => [movement, ...prev]);
            addLog('STOCK_ADJUSTMENT', `Stock adjusted for ${productId}: ${quantity > 0 ? '+' : ''}${quantity} (${type})`).catch(console.error);
        } catch (err) {
            console.error('adjustStock error:', err);
            throw err;
        }
    }, [user, addLog, products]);

    const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
        const payload = {
            ...productData,
            createdBy: user?.id || null,
            createdByName: user?.name || null
        };
        const created = await ApiClient.post('/api/products', payload);
        setProducts(prev => {
            const next = [created, ...prev];
            try { localStorage.setItem('app.products', JSON.stringify(next)); } catch {};
            return next;
        });

        // create initial stock movement
        const movement = await ApiClient.post('/api/inventory', {
            productId: created.id,
            productName: created.name,
            type: 'RESTOCK',
            quantity: created.quantity || 0,
            previousStock: 0,
            newStock: created.quantity || 0,
            reason: 'Initial Product Creation',
            date: new Date().toISOString(),
            userId: user?.id || 'system',
            userName: user?.name || 'System'
        });
        setStockMovements(prev => {
            const next = [movement, ...prev];
            try { localStorage.setItem('app.stockMovements', JSON.stringify(next)); } catch {};
            return next;
        });

        addLog('INVENTORY_ADD', `Added product: ${productData.name}`).catch(console.error);
    }, [user, addLog]);

    const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        addLog('PRODUCT_UPDATE', `Updated product details for ID: ${id}`).catch(console.error);
    }, [addLog]);

    const updateProductStock = useCallback(async (id: string, qtyChange: number) => {
        await adjustStock(id, qtyChange, qtyChange > 0 ? 'RESTOCK' : 'CORRECTION', 'Manual Quick Update');
    }, [adjustStock]);

    const addSale = useCallback(async (saleData: Omit<Sale, 'id'>) => {
        const saleWithAttribution = {
            ...saleData,
            initiatedBy: user?.id || null,
            initiatedByName: user?.name || 'Unknown'
        };
        const created = await ApiClient.post('/api/sales', saleWithAttribution);
        setSales(prev => {
            const next = [created, ...prev];
            try { localStorage.setItem('app.sales', JSON.stringify(next)); } catch {};
            return next;
        });

        // Update inventory for each item sold
        for (const item of saleData.items) {
            await adjustStock(item.productId, -item.quantity, 'SALE', `Sale Transaction`);
        }

        // Update customer balance if applicable (local state)
        if (saleData.customerId) {
            setCustomers(prev => {
                const next = prev.map(c => c.id === saleData.customerId ? {
                    ...c,
                    totalSpent: (c.totalSpent || 0) + saleData.total,
                    balance: (c.balance || 0) + (saleData.total - saleData.amountPaid),
                    lastVisit: new Date().toISOString()
                } : c);
                try { localStorage.setItem('app.customers', JSON.stringify(next)); } catch {};
                return next;
            });
        }

        addLog('SALE_COMPLETE', `Sale completed for $${saleData.total}`).catch(console.error);
    }, [user, addLog, adjustStock]);

    const addCustomer = useCallback(async (customer: Omit<Customer, 'id'>) => {
        const created = await ApiClient.post('/api/customers', {
            ...customer,
            createdBy: user?.id || null,
            createdByName: user?.name || null
        });
        setCustomers(prev => {
            const next = [created, ...prev];
            try { localStorage.setItem('app.customers', JSON.stringify(next)); } catch {};
            return next;
        });
        addLog('CUSTOMER_ADD', `Added new customer: ${customer.name}`).catch(console.error);
    }, [user, addLog]);

    const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id'>) => {
        if (!user) throw new Error("You must be logged in to add a supplier.");

        const cleanSupplier = {
            name: supplier.name || 'Unknown Supplier',
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            status: supplier.status || 'Active',
            createdAt: (supplier as any).createdAt || new Date().toISOString(),
            createdBy: user.id,
            createdByName: user.name
        };

        const created = await ApiClient.post('/api/suppliers', cleanSupplier);
        setSuppliers(prev => {
            const next = [created, ...prev];
            try { localStorage.setItem('app.suppliers', JSON.stringify(next)); } catch {};
            return next;
        });
        addLog('SUPPLIER_ADD', `Added new supplier: ${cleanSupplier.name}`).catch(console.error);
    }, [user, addLog]);

    const receiveStock = useCallback(async (supplierId: string, items: { productId: string; quantity: number; cost: number }[]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        let totalAmount = 0;
        const enrichedItems: any[] = [];

        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            const productName = product ? product.name : 'Unknown Product';

            // Update product cost locally
            if (product) {
                setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, cost: item.cost, quantity: (p.quantity || 0) + item.quantity } : p));
            }

            totalAmount += item.cost * item.quantity;
            enrichedItems.push({ ...item, productName });

            // Log stock movement
            const move = await ApiClient.post('/api/inventory', {
                productId: item.productId,
                productName,
                type: 'RESTOCK',
                quantity: item.quantity,
                previousStock: product?.quantity || 0,
                newStock: (product?.quantity || 0) + item.quantity,
                reason: `Received from ${supplier.name}`,
                date: new Date().toISOString(),
                userId: user?.id || 'system',
                userName: user?.name || 'System'
            });
                setStockMovements(prev => {
                    const next = [move, ...prev];
                    try { localStorage.setItem('app.stockMovements', JSON.stringify(next)); } catch {};
                    return next;
                });
        }

        // Record supplier transaction
        const tx = await ApiClient.post('/api/supplierTransactions', {
            supplierId,
            supplierName: supplier.name,
            date: new Date().toISOString(),
            type: 'SUPPLY',
            amount: totalAmount,
            description: `Received ${items.length} unique items`,
            items: enrichedItems,
            initiatedBy: user?.id || null,
            initiatedByName: user?.name || null
        });
        setSupplierTransactions(prev => {
            const next = [tx, ...prev];
            try { localStorage.setItem('app.supplierTransactions', JSON.stringify(next)); } catch {};
            return next;
        });

        addLog('STOCK_RECEIVED', `Received stock from ${supplier.name}. Total: $${totalAmount}`).catch(console.error);
    }, [user, addLog, suppliers, products]);

    const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
        const payload = {
            ...expense,
            recordedBy: user?.id || null,
            recordedByName: user?.name || null
        };
        const created = await ApiClient.post('/api/expenses', payload);
        setExpenses(prev => {
            const next = [created, ...prev];
            try { localStorage.setItem('app.expenses', JSON.stringify(next)); } catch {};
            return next;
        });

        // If expense is related to a supplier, create supplierTransaction(s)
        if (expense.supplierId) {
            const supplier = suppliers.find(s => s.id === expense.supplierId);
            if (supplier) {
                await ApiClient.post('/api/supplierTransactions', {
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    date: expense.date,
                    type: 'EXPENSE',
                    amount: expense.amount,
                    description: expense.description,
                    reference: expense.reference,
                    initiatedBy: user?.id || null,
                    initiatedByName: user?.name || null
                });

                if (expense.status === 'Paid') {
                    const pay = await ApiClient.post('/api/supplierTransactions', {
                        supplierId: supplier.id,
                        supplierName: supplier.name,
                        date: expense.date,
                        type: 'PAYMENT',
                        amount: expense.amount,
                        description: `Payment for: ${expense.description}`,
                        reference: expense.reference,
                        initiatedBy: user?.id || null,
                        initiatedByName: user?.name || null
                    });
                    setSupplierTransactions(prev => {
                        const next = [pay, ...prev];
                        try { localStorage.setItem('app.supplierTransactions', JSON.stringify(next)); } catch {};
                        return next;
                    });
                }
            }
        }

        const action = expense.type === 'DEPOSIT' ? 'DEPOSIT_ADD' : 'EXPENSE_ADD';
        addLog(action, `${expense.type}: ${expense.description} - $${expense.amount}`).catch(console.error);
    }, [user, addLog, suppliers]);

    const addSupplierPayment = useCallback(async (data: Omit<SupplierTransaction, 'id' | 'type' | 'items'> & { paymentMethod?: string }) => {
        const tx = await ApiClient.post('/api/supplierTransactions', {
            supplierId: data.supplierId,
            supplierName: data.supplierName,
            date: data.date,
            type: 'PAYMENT',
            amount: data.amount,
            description: data.description,
            reference: data.reference,
            initiatedBy: user?.id || null,
            initiatedByName: user?.name || null
        });
        setSupplierTransactions(prev => [tx, ...prev]);

        await addExpense({
            type: 'EXPENSE',
            date: data.date,
            category: 'Supplier Payment',
            description: `Payment to ${data.supplierName}: ${data.description}`,
            amount: data.amount,
            paymentMethod: data.paymentMethod || 'Bank Transfer',
            reference: data.reference,
            status: 'Paid',
            supplierId: data.supplierId
        });
    }, [user, addExpense]);

    const addPayroll = useCallback(async (entry: Omit<PayrollEntry, 'id'>) => {
        const created = await ApiClient.post('/api/payroll', {
            ...entry,
            processedBy: user?.id || null,
            processedByName: user?.name || null
        });
        setPayroll(prev => [created, ...prev]);

        // Record as an expense
        await addExpense({
            type: 'EXPENSE',
            date: entry.paymentDate,
            category: 'Payroll',
            description: `Salary Payment: ${entry.staffName} (${entry.department})`,
            amount: entry.amount,
            paymentMethod: 'Bank Transfer',
            reference: `PAY-${String(created.id).slice(-6)}`,
            status: 'Paid'
        });

        addLog('PAYROLL', `Processed payroll for ${entry.staffName}: $${entry.amount}`).catch(console.error);
    }, [user, addLog, addExpense]);

    // --------------------------------------------------------------------------------
    // 6. Provider Value
    // --------------------------------------------------------------------------------
    return (
        <AppContext.Provider value={{
            user, loading, users, products, sales, logs, customers, suppliers, supplierTransactions, expenses, stockMovements, payroll, invitations,
            // Auth/User Actions
            login, register, resetPassword, logout, updateUserProfile, toggleUserStatus,
            // Invitation Actions
            createInvitation, revokeInvitation, acceptInvitation, validateInvitation, fetchLastInvitation,
            // Business Logic
            addProduct, updateProduct, updateProductStock, addSale, addCustomer, addSupplier,
            receiveStock, addSupplierPayment, addExpense, adjustStock, addPayroll,
        }}>
            {children}
        </AppContext.Provider>
    );
};

// --------------------------------------------------------------------------------
// 7. useApp Hook
// --------------------------------------------------------------------------------
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};