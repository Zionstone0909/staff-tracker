import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Trash2, Copy, Check, Mail, Loader2, RefreshCw } from 'lucide-react';

const Settings = () => {
  const { user, users, createInvitation, revokeInvitation, invitations, toggleUserStatus, logs, updateUserProfile, fetchLastInvitation } = useApp();
  
  // -- General / Profile State --
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // -- Invite State --
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.STAFF);
  const [lastInvitedName, setLastInvitedName] = useState(() => sessionStorage.getItem('cim_invite_name') || '');
  const [lastInvitedEmail, setLastInvitedEmail] = useState(() => sessionStorage.getItem('cim_invite_email') || '');
  const [generatedLink, setGeneratedLink] = useState(() => sessionStorage.getItem('cim_invite_link') || '');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // -- Logs State --
  const [selectedUserLogId, setSelectedUserLogId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user?.name]);

  // Effect to restore invitation from backend if session storage is empty (Cross-device support)
  useEffect(() => {
    const restoreInvite = async () => {
        if (!generatedLink && user?.role === Role.ADMIN) {
            try {
                const lastInvite = await fetchLastInvitation();
                if (lastInvite) {
                    const link = `${window.location.origin}/join?token=${lastInvite.token}`;
                    setGeneratedLink(link);
                    setLastInvitedName(lastInvite.name);
                    setLastInvitedEmail(lastInvite.email);
                    
                    // Sync to session storage
                    sessionStorage.setItem('cim_invite_link', link);
                    sessionStorage.setItem('cim_invite_name', lastInvite.name);
                    sessionStorage.setItem('cim_invite_email', lastInvite.email);
                }
            } catch (e) {
                console.error("Could not restore last invite", e);
            }
        }
    };
    restoreInvite();
  }, [user, generatedLink, fetchLastInvitation]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUpdatingProfile(true);
      setProfileMsg({ text: '', type: '' });
      try {
          await updateUserProfile(profileName);
          setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      } catch (err: any) {
          setProfileMsg({ text: 'Failed to update profile.', type: 'error' });
      } finally {
          setIsUpdatingProfile(false);
      }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInviting) return;

    setIsInviting(true);
    setInviteMsg({ text: '', type: '' });
    setGeneratedLink('');
    
    const name = inviteName.trim();
    const email = inviteEmail.trim();

    if (!name || !email) {
        setInviteMsg({ text: 'Please provide both name and email.', type: 'error' });
        setIsInviting(false);
        return;
    }

    try {
      // Race condition to prevent infinite loading if backend hangs
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 15000)
      );
      
      const token = await Promise.race([
          createInvitation(name, email, inviteRole),
          timeoutPromise
      ]);
      
      const link = `${window.location.origin}/join?token=${token}`;

      setGeneratedLink(link);
      setLastInvitedName(name);
      setLastInvitedEmail(email);

      sessionStorage.setItem('cim_invite_link', link);
      sessionStorage.setItem('cim_invite_name', name);
      sessionStorage.setItem('cim_invite_email', email);
      
      setInviteMsg({ text: `Invitation generated successfully!`, type: 'success' });
      setInviteName('');
      setInviteEmail('');
      setInviteRole(Role.STAFF);
    } catch (err: any) {
      console.error(err);
      setInviteMsg({ text: err.message || 'Failed to generate invitation', type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const copyLink = () => {
      navigator.clipboard.writeText(generatedLink);
      setInviteMsg({ text: 'Link copied to clipboard!', type: 'success' });
  };

  const copyTableLink = (token: string) => {
      const link = `${window.location.origin}/join?token=${token}`;
      navigator.clipboard.writeText(link);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (token: string) => {
      if(!window.confirm('Are you sure you want to revoke this invitation? The link will become invalid.')) return;
      try {
          await revokeInvitation(token);
          if (generatedLink.includes(token)) {
              setGeneratedLink('');
              sessionStorage.removeItem('cim_invite_link');
          }
      } catch(e) {
          console.error(e);
          alert('Failed to revoke invitation.');
      }
  };

  const sendEmail = () => {
      const subject = encodeURIComponent("Welcome to Cloud Inventory Manager");
      const body = encodeURIComponent(
          `Hi ${lastInvitedName},\n\n` +
          `You have been invited to join the Cloud Inventory Manager system.\n\n` +
          `Please click the link below to set up your account and password:\n` +
          `${generatedLink}\n\n` +
          `Best regards,\n` +
          `${user?.name || 'The Admin Team'}`
      );
      window.open(`mailto:${lastInvitedEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  // Find selected user details
  const selectedUser = users.find(u => u.id === selectedUserLogId);

  // Filter logs for selected user, specific to LOGIN action, and sort by date descending
  const userLogs = selectedUserLogId 
    ? logs
        .filter(l => l.userId === selectedUserLogId && l.action === 'LOGIN')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Settings</h1>

      {/* --- General Settings (For All Users) --- */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            General Profile Settings
          </h2>
          
          {profileMsg.text && (
            <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                      type="text" 
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email (Read-only)</label>
                  <input 
                      type="email" 
                      disabled
                      className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      value={user?.email || ''}
                  />
              </div>
              <div className="md:col-span-2">
                  <button 
                      type="submit" 
                      disabled={isUpdatingProfile}
                      className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                      {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
              </div>
          </form>
          <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
             Current Role: <span className="font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{user?.role}</span>
          </div>
      </div>

      {/* --- Admin Only Sections --- */}
      {user?.role === Role.ADMIN && (
          <>
            {/* Invite Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    Invite New Staff
                </h2>
                <p className="text-gray-600 mb-6 text-sm">
                    Generate a secure registration link for new staff members.
                </p>
                
                {inviteMsg.text && (
                    <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${inviteMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {inviteMsg.text}
                    </div>
                )}

                <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Staff Name</label>
                        <input 
                        required
                        type="text" 
                        autoComplete="name"
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Jane Smith"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                        disabled={isInviting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input 
                        required
                        type="email" 
                        autoComplete="email"
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. jane@company.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                        <select
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as Role)}
                            disabled={isInviting}
                        >
                            <option value={Role.STAFF}>Staff</option>
                            <option value={Role.ADMIN}>Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-3 mt-2">
                        <button 
                            disabled={isInviting}
                            type="submit" 
                            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                        >
                            {isInviting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                                </>
                            ) : 'Generate Invite Link'}
                        </button>
                    </div>
                </form>

                {generatedLink && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in">
                        <label className="block text-xs font-bold text-blue-700 uppercase mb-2">Invitation Link Generated</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={generatedLink} 
                                className="flex-1 p-2.5 border border-blue-200 rounded-lg text-gray-600 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.currentTarget.select()}
                            />
                            <div className="flex gap-2">
                                <button onClick={copyLink} className="flex-1 sm:flex-none bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 font-medium transition-colors">
                                    <Copy className="w-4 h-4" /> Copy
                                </button>
                                <button onClick={sendEmail} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-blue-600/80 mt-2 font-medium">Share this link securely with the new staff member.</p>
                    </div>
                )}
                
                {/* Pending Invites List */}
                {invitations.length > 0 && (
                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <h3 className="font-bold text-sm text-gray-500 uppercase mb-4 tracking-wider">Pending Invitations</h3>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Role</th>
                                            <th className="p-3">Created</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invitations.map(inv => (
                                            <tr key={inv.token} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-3 font-medium text-gray-900">{inv.name}</td>
                                                <td className="p-3 text-gray-500">{inv.email}</td>
                                                <td className="p-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${inv.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {inv.role}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-400 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => copyTableLink(inv.token)}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs transition font-medium"
                                                            title="Copy Link"
                                                        >
                                                            {copiedToken === inv.token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                            {copiedToken === inv.token ? 'Copied' : 'Link'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevoke(inv.token)}
                                                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Revoke Invite"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">Staff Management</h2>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{users.length} Users</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 uppercase text-gray-500 font-semibold text-xs tracking-wider border-b border-gray-200">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-gray-900">{u.name}</div>
                                <div className="text-gray-500 text-xs">{u.email}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === Role.ADMIN ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td className="p-4">
                                {u.isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Suspended
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-gray-500">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => setSelectedUserLogId(selectedUserLogId === u.id ? null : u.id)}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${selectedUserLogId === u.id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {selectedUserLogId === u.id ? 'Hide Activity' : 'Log'}
                                    </button>
                                    {u.id !== user?.id && (
                                        <button 
                                            onClick={() => toggleUserStatus(u.id, !!u.isActive)}
                                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${u.isActive ? 'bg-white text-red-600 border-gray-200 hover:bg-red-50 hover:border-red-200' : 'bg-green-600 text-white border-green-600 hover:bg-green-700'}`}
                                        >
                                            {u.isActive ? 'Suspend' : 'Activate'}
                                        </button>
                                    )}
                                </div>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity Logs Panel */}
            {selectedUserLogId && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded text-indigo-600">
                            <RefreshCw className="w-4 h-4" />
                        </div>
                        Login Activity: <span className="text-gray-600 font-normal">{selectedUser ? selectedUser.name : 'Unknown User'}</span>
                    </h3>
                    {userLogs.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm">
                            No login activity recorded for this user.
                        </div>
                    ) : (
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.details}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </>
      )}
    </div>
  );
};

export default Settings;