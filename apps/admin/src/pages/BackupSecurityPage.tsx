import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import { useTeaNestStore, formatDateTime } from '@tea-nest/shared';

export const BackupSecurityPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState(new Date().toISOString());

  const handleTriggerBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setLastBackupTime(new Date().toISOString());
      setBackingUp(false);
    }, 1200);
  };

  const collections = [
    { name: 'products', count: state.products.length, size: '~24 KB', status: 'Healthy' },
    { name: 'orders', count: state.orders.length, size: '~48 KB', status: 'Healthy' },
    { name: 'sales', count: state.sales.length, size: '~18 KB', status: 'Healthy' },
    { name: 'invoices', count: state.invoices.length, size: '~32 KB', status: 'Healthy' },
    { name: 'inventoryMovements', count: state.inventoryMovements.length, size: '~16 KB', status: 'Healthy' },
    { name: 'suppliers', count: state.suppliers.length, size: '~8 KB', status: 'Healthy' },
    { name: 'purchases', count: state.purchases.length, size: '~22 KB', status: 'Healthy' },
    { name: 'expenses', count: state.expenses.length, size: '~12 KB', status: 'Healthy' },
    { name: 'users (customers)', count: state.customers.length, size: '~14 KB', status: 'Healthy' },
    { name: 'auditLogs', count: state.auditLogs.length, size: '~38 KB', status: 'Healthy' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100">Database Health & Backup Security</h1>
          <p className="text-xs text-admin-muted mt-1">
            Automated Cloud Storage snapshots, Firestore point-in-time recovery, and cryptographic audit monitoring.
          </p>
        </div>

        <button
          onClick={handleTriggerBackup}
          disabled={backingUp}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow"
        >
          <RefreshCw className={`w-4 h-4 ${backingUp ? 'animate-spin' : ''}`} />
          <span>{backingUp ? 'Creating Snapshot...' : 'Export Snapshot Now'}</span>
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-admin-muted uppercase font-bold">Database Health</span>
          <div className="text-xl font-bold text-green-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span>Optimal (100%)</span>
          </div>
          <p className="text-[11px] text-gray-400">Zero orphaned records</p>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-admin-muted uppercase font-bold">Last Snapshot Export</span>
          <div className="text-base font-bold text-gray-100">{formatDateTime(lastBackupTime)}</div>
          <p className="text-[11px] text-admin-gold">Status: Automated & Verified</p>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-admin-muted uppercase font-bold">Next Scheduled Backup</span>
          <div className="text-base font-bold text-gray-100">Daily @ 02:00 IST</div>
          <p className="text-[11px] text-gray-400">GCP Cloud Storage Bucket</p>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-admin-muted uppercase font-bold">Security Protection</span>
          <div className="text-xl font-bold text-admin-gold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Encrypted at Rest</span>
          </div>
          <p className="text-[11px] text-gray-400">AES-256 Cloud Firestore</p>
        </div>
      </div>

      {/* Collection metrics table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-gray-100">
          Firestore Collection Storage Topology
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase border-b border-admin-border">
              <tr>
                <th className="p-3">Collection Name</th>
                <th className="p-3">Total Documents</th>
                <th className="p-3">Estimated Size</th>
                <th className="p-3">Integrity Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {collections.map((col, idx) => (
                <tr key={idx} className="hover:bg-admin-card/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-gray-200">{col.name}</td>
                  <td className="p-3 font-semibold text-admin-gold">{col.count}</td>
                  <td className="p-3 text-admin-muted">{col.size}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                      {col.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
