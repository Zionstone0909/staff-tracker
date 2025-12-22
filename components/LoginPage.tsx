import React, { useState } from 'react';
// Assuming your context provides the necessary auth functions (login, resetPassword)
// and handles navigation/routing upon successful login.
import { useApp } from '../context/AppContext'; 
import { Role } from '../types'; 
import { Lock, AlertCircle, ArrowRight, Shield, BarChart3, Users, Mail, ArrowLeft, CheckCircle, LucideIcon, Fish } from 'lucide-react';

interface InputFieldProps {
  label: string;
  icon: LucideIcon;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}

const InputField = ({ label, icon: Icon, type = "text", placeholder, value, onChange, autoFocus, autoComplete }: InputFieldProps) => (
  <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-700 ml-1">
          {label}
      </label>
      <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
          </div>
          <input
              autoFocus={autoFocus}
              type={type}
              value={value}
              onChange={onChange}
              autoComplete={autoComplete}
              className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all duration-200 font-medium shadow-sm"
              placeholder={placeholder}
              required
          />
      </div>
  </div>
);

export const LoginPage = () => {
    // We expect login, register, and resetPassword functions from the context/backend
    const { login, register, resetPassword } = useApp(); 
    
    // View State: 'login' | 'forgot' | 'register_staff'
    const [view, setView] = useState<'login' | 'forgot' | 'register_staff'>('login');
    
    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Added name state for registration

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // --- SPECIFIC ADMIN LOGIN LOGIC ---
        // Validate specific admin credentials upfront for clarity
        const ADMIN_EMAIL = 'hannahakanni7@gmail.com';
        const ADMIN_PASS = '1234567890';

        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            try {
                // In a real app, this should be handled by your backend service securely,
                // but we simulate the login/provisioning here based on your explicit request.
                await login(email, password); 
                setSuccess('Admin login successful. Redirecting...');
                // The AppContext/Router should handle navigation from here.
                return;
            } catch (err: any) {
                // If the specific admin account doesn't exist in the DB yet (first run), provision it.
                if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                    try {
                        await register('System Admin', email, password, Role.ADMIN);
                        setSuccess('Admin account initialized & logging you in...');
                        return; // Auth listener handles redirect
                    } catch (regErr: any) {
                         setError("Admin setup failed. Contact IT.");
                    }
                }
            } finally {
                setIsLoading(false);
                return;
            }
        }
        // --- END SPECIFIC ADMIN LOGIN LOGIC ---
        

        // --- GENERAL LOGIN LOGIC FOR STAFF ---
        try {
            if (!email || !password) throw new Error('Please enter your credentials');
            await login(email, password);
            // Login success (redirect) is handled by auth state listener in AppContext
        } catch (err: any) {
            console.error("Login failed", err);
            
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                  setError('Invalid email or password.');
            } else if (err.code === 'auth/too-many-requests') {
                  setError('Access temporarily disabled due to many failed attempts. Try again later.');
            } else if (err.message === 'Account is suspended.') {
                  setError('Your account has been suspended. Please contact the administrator.');
            } else {
                  setError(err.message || 'Login failed. Please check your credentials.');
            }
            setIsLoading(false);
        }
    };

    // Note: Staff registration logic will eventually move to a separate page/component 
    // triggered by an email link, but we can prototype the view here for clarity.
    const handleStaffRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // In a real app, this registration uses a token from the email link for verification
            await register(name, email, password, Role.STAFF);
            setSuccess('Registration successful! You can now log in using the login page.');
            setTimeout(() => switchView('login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
            setIsLoading(false);
        }
    }


    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await resetPassword(email);
            setSuccess('If an account exists, a reset link has been sent.');
            setTimeout(() => switchView('login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchView = (newView: 'login' | 'forgot' | 'register_staff') => {
        setView(newView);
        setError('');
        setSuccess('');
        setEmail('');
        setPassword('');
        setName('');
    };

    const renderForm = () => {
        switch (view) {
            case 'login':
                return (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <InputField
                            label="Email Address"
                            icon={Mail}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                            autoComplete="username"
                        />
                        <InputField
                            label="Password"
                            icon={Lock}
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        <div className="flex items-center justify-end pt-1">
                            <button 
                                type="button" 
                                onClick={() => switchView('forgot')} 
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                            {!isLoading && <ArrowRight className="h-5 w-5" />}
                        </button>
                    </form>
                );
            case 'register_staff':
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <button onClick={() => switchView('login')} className="flex items-center text-blue-600 mb-4 hover:text-blue-700 font-medium text-sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                        </button>
                        <h2 className="text-3xl font-extrabold text-slate-900">Complete Registration</h2>
                        <p className="text-slate-500 pb-2">Set up your staff account.</p>
                        <form onSubmit={handleStaffRegistration} className="space-y-5">
                            <InputField
                                label="Full Name"
                                icon={Users}
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                            <InputField
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                            />
                            <InputField
                                label="Set Password"
                                icon={Lock}
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95"
                            >
                                {isLoading ? 'Registering...' : 'Register Account'}
                                {!isLoading && <CheckCircle className="h-5 w-5" />}
                            </button>
                        </form>
                    </div>
                );
            case 'forgot':
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <button onClick={() => switchView('login')} className="flex items-center text-blue-600 mb-4 hover:text-blue-700 font-medium text-sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                        </button>
                        <h2 className="text-3xl font-extrabold text-slate-900">Reset Password</h2>
                        <p className="text-slate-500 pb-2">Enter your email to receive a reset link.</p>
                        <form onSubmit={handleForgot} className="space-y-5">
                            <InputField
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                autoComplete="email"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95"
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                                {!isLoading && <Mail className="h-5 w-5" />}
                            </button>
                        </form>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-6 font-sans">
            <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] lg:min-h-[700px]">
                
                {/* Left Panel - Feature List (Hidden on Mobile) */}
                <div className="hidden md:flex w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 relative flex-col justify-between p-10 lg:p-12 overflow-hidden text-white">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                                <Fish className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">Jireh Fishes</h1>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4">
                            Manage your inventory with ease and precision.
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
                            Streamline operations, track sales in real-time, and manage stock levels efficiently.
                        </p>
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
                            <BarChart3 className="w-6 h-6 text-blue-200" />
                            <div>
                                <p className="font-bold text-sm">Real-time Analytics</p>
                                <p className="text-xs text-blue-200">Track sales performance instantly</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
                            <Shield className="w-6 h-6 text-blue-200" />
                            <div>
                                <p className="font-bold text-sm">Secure & Reliable</p>
                                <p className="text-xs text-blue-200">Enterprise-grade data protection</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-3xl" />
                </div>

                {/* Right Panel - Login/Forgot Form */}
                <div className="w-full md:w-7/12 p-6 md:p-10 lg:p-16 flex flex-col justify-center bg-white relative">
                    <div className="max-w-md mx-auto w-full">
                        
                        {view === 'login' && (
                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
                                <p className="text-slate-500">Sign in to your dashboard.</p>
                            </div>
                        )}

                        {/* Notifications */}
                        {error && (
                            <div className="mb-6 flex items-start p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2" role="alert">
                                <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                <div>{error}</div>
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 flex items-start p-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl animate-in fade-in slide-in-from-top-2" role="alert">
                                <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                <div>{success}</div>
                            </div>
                        )}

                        {renderForm()}
                    </div>
                </div>
            </div>
        </div>
    );
};