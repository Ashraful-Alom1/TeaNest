import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTeaNestStore, formatDate } from '@tea-nest/shared';
import { AdminRole, ROLE_PERMISSIONS } from '@tea-nest/types';

export const UsersPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('INVENTORY_MANAGER');

  const adminUsers = state.adminUsers;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    state.adminUsers.push({
      uid: `admin_${Date.now()}`,
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: state.currentAdmin?.uid || 'admin',
      actorEmail: state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'ROLE_CHANGED',
      entityType: 'USER',
      entityId: email,
      after: { role },
      timestamp: new Date().toISOString(),
    });

    setModalOpen(false);
    setEmail('');
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Admin Roles & Permissions (RBAC)</h1>
          <p className="text-xs text-admin-muted mt-1">
            Super Admin bootstrap, staff role delegation, and access security constraints.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Permissions Scope</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {adminUsers.map((u) => {
                const perms = ROLE_PERMISSIONS[u.role] || [];

                return (
                  <tr key={u.uid} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4 font-bold text-gray-200">{u.name}</td>
                    <td className="p-4 text-admin-muted">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-admin-card text-admin-gold border border-admin-border">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 max-w-xs truncate">
                      {perms.length === 27 ? 'All Privileges (Super Admin)' : perms.join(', ')}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-admin-muted">{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold">Add Staff Member</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-admin-muted mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 bg-admin-card border border-admin-border rounded-lg text-gray-200 outline-none focus:border-admin-accent"
                >
                  <option value="INVENTORY_MANAGER">INVENTORY MANAGER (Products, movements, stock)</option>
                  <option value="SALES_MANAGER">SALES MANAGER (Orders, CRM, sales reports)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Invoices, billing, expenses, GST)</option>
                  <option value="PROCUREMENT_MANAGER">PROCUREMENT MANAGER (Purchases, suppliers)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Full system authorization)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-admin-card text-gray-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-lg font-bold shadow"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
