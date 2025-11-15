'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [role, setRole] = useState('');
  const router = useRouter();

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole);
    router.push(`/${selectedRole}/login`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Business Tracker</h1>
        <p className="mb-6">Staff Salary & Expense Management System</p>

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => handleRoleSelection('staff')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Staff Login
          </button>
          <button
            onClick={() => handleRoleSelection('admin')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Admin Portal
          </button>
        </div>

        {role && (
          <p className="mt-4 text-sm text-gray-600">
            Redirecting to {`/${role}/login`}...
          </p>
        )}
      </div>
    </div>
  );
}
