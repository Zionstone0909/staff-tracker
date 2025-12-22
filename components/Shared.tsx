import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyle = "rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    ghost: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`w-full sm:w-auto ${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const BackButton = ({ onClick }: { onClick?: () => void }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={onClick || (() => navigate(-1))} 
      className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-gray-100"
      type="button"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
};

export const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
    purple: "bg-purple-100 text-purple-800",
    indigo: "bg-indigo-100 text-indigo-800",
    emerald: "bg-emerald-100 text-emerald-800",
    orange: "bg-orange-100 text-orange-800",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[color] || colors.gray}`}>{children}</span>;
};

export const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full ${className}`} 
      {...props} 
    />
  </div>
);

export const Select = ({ label, children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full border border-gray-300 rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500 ${className}`} 
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export const Table = ({ headers, children }: { headers: string[], children: React.ReactNode }) => (
  <div className="overflow-x-auto sm:rounded-lg border border-gray-200 shadow-sm bg-white">
    <table className="min-w-full divide-y divide-gray-200 table-fixed">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {children}
      </tbody>
    </table>
  </div>
);