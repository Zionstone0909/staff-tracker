import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types'; // Ensure Role is imported from your types file
import { Loader2, ArrowRight, XCircle, Mail, User as UserIcon } from 'lucide-react';

interface StaffManagementProps {
    onBack: () => void; // Prop required by App.tsx for navigation
}

export const StaffManagement = ({ onBack }: StaffManagementProps) => {
    // We use createInvitation, users for checking existing accounts, and invitations for listing pending ones.
    const { createInvitation, revokeInvitation, users, invitations } = useApp();

    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>(Role.STAFF); // Default to Staff
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateInvite = async () => {
        if (!inviteName || !inviteEmail) {
            alert('Name and Email are required.');
            return;
        }
        
        // Simple client-side check if user already exists
        if (users.some(u => u.email.toLowerCase() === inviteEmail.toLowerCase())) {
             alert(`User with email ${inviteEmail} is already registered. Please check the 'Users' list.`);
             return;
        }

        setIsSubmitting(true);
        try {
            // The createInvitation function handles token generation and saves it to Firestore.
            const token = await createInvitation(inviteName, inviteEmail, inviteRole);
            const invitationLink = `${window.location.origin}/join?token=${token}`;
            
            // Show success message and the link for the admin to copy
            alert(`
                SUCCESS! Invitation created for ${inviteName} (${inviteEmail}).
                
                ACTION REQUIRED: Please copy the link below and securely send it to the staff member:
                
                ${invitationLink}
            `);
            
            // Clear form
            setInviteName('');
            setInviteEmail('');
            setInviteRole(Role.STAFF);

        } catch (error: any) {
            console.error('Failed to create invitation:', error);
            alert(`Failed to create invitation: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevokeInvite = async (token: string, name: string) => {
        if (window.confirm(`Are you sure you want to revoke the invitation for ${name}? This action cannot be undone.`)) {
            try {
                await revokeInvitation(token);
                alert(`Invitation for ${name} has been revoked.`);
            } catch (error: any) {
                console.error('Failed to revoke invitation:', error);
                alert(`Failed to revoke invitation: ${error.message || 'Unknown error'}`);
            }
        }
    }

    // Filter to only show pending invitations
    const pendingInvitations = invitations.filter(i => i.status === 'PENDING');

    return (
        <div className="mx-auto p-0">
            <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-6 flex items-center">
                <ArrowRight className="w-4 h-4 rotate-180 mr-2" /> Back to Dashboard
            </button>
            <div className="max-w-4xl bg-white rounded-xl shadow-lg border border-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-6 border-b pb-3">Admin Panel: Staff Management</h1>
                <p className="text-slate-600 mb-8">Create and manage registration links for new staff members.</p>
                
                {/* Invitation Form */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-10">
                    <h2 className="text-xl font-semibold mb-4 text-slate-800">Create New Staff Invitation</h2>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <UserIcon className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Staff Name"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="flex-1 relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="email"
                                placeholder="Staff Email (Target)"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                         <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as Role)}
                            className="p-3 border border-slate-300 rounded-lg w-full sm:w-40 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                        >
                            <option value={Role.STAFF}>Staff</option>
                            <option value={Role.ADMIN}>Admin</option>
                        </select>

                        <button 
                            onClick={handleCreateInvite}
                            className="bg-indigo-600 text-white px-5 py-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                            disabled={!inviteName || !inviteEmail || isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Create Registration Link'
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Pending Invitations List */}
                <div>
                     <h2 className="text-xl font-semibold mb-4 text-slate-800">Pending Invitations ({pendingInvitations.length})</h2>
                     <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                        {pendingInvitations.length === 0 ? (
                            <p className="text-slate-500 text-sm italic p-4 text-center">No pending invitations.</p>
                        ) : (
                            pendingInvitations.map(invite => (
                                <div key={invite.token} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm bg-white hover:bg-slate-50 transition-colors gap-2">
                                    <div>
                                        <span className="font-bold text-slate-800">{invite.name}</span>
                                        <span className="text-slate-500"> ({invite.email}) - </span>
                                        <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${invite.role === Role.ADMIN ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {invite.role}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 items-center w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="text-xs text-slate-400">Created: {new Date(invite.createdAt).toLocaleDateString()}</span>
                                        <button 
                                            onClick={() => handleRevokeInvite(invite.token, invite.name)} 
                                            className="text-xs text-red-600 font-medium hover:text-red-800 flex items-center gap-1"
                                        >
                                            <XCircle className='w-4 h-4' /> Revoke
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                </div>

                {/* Registered Users List (Optional, but useful for Admin) */}
                <div className="mt-10">
                    <h2 className="text-xl font-semibold mb-4 text-slate-800">Registered Users ({users.length})</h2>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                        {users.map(u => (
                             <div key={u.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm bg-white hover:bg-slate-50 transition-colors gap-2">
                                <div>
                                    <span className="font-bold text-slate-800">{u.name}</span>
                                    <span className="text-slate-500"> ({u.email}) - </span>
                                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${u.role === Role.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {u.role}
                                    </span>
                                </div>
                                <div>
                                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {u.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};