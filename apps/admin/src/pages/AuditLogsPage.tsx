import React from 'react';

import { useTeaNestStore, formatDateTime } from '@tea-nest/shared';

export const AuditLogsPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const logs = [...state.auditLogs].reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-100">Enterprise Security Audit Logs</h1>
        <p className="text-xs text-admin-muted mt-1">
          Immutable forensic log of administrative actions, role assignments, price revisions, and stock transactions.
        </p>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4">Change Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {logs.map((log) => (
                <tr key={log.logId} className="hover:bg-admin-card/50 transition-colors">
                  <td className="p-4 text-admin-muted">{formatDateTime(log.timestamp)}</td>
                  <td className="p-4 font-semibold text-gray-200">{log.actorEmail}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-admin-card text-admin-gold border border-admin-border">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-200">{log.action}</td>
                  <td className="p-4 text-admin-muted">{log.entityType}</td>
                  <td className="p-4 font-mono text-gray-400">{log.entityId}</td>
                  <td className="p-4 text-gray-300 max-w-xs truncate">
                    {log.after ? JSON.stringify(log.after) : '-'}
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
