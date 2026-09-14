'use client';

import React, { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';
import { History, Shield, RefreshCw, Filter, Search } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit?limit=100');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    return log.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security & Cryptographic Audit Trails
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable audit logging tracking score encryptions, homomorphic additions, and authorized decryption events
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 shadow-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="all">All Cryptographic & System Actions</option>
          <option value="HOMOMORPHIC">Homomorphic Evaluations</option>
          <option value="DECRYPTION">Decryptions & Approvals</option>
          <option value="SYSTEM">System Events</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading audit log repository...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Initiator</th>
                  <th>Target Entity</th>
                  <th>Cryptographic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="font-mono text-xs text-slate-600 block">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-800">
                        {log.user_name || 'System Daemon'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-slate-500 capitalize">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 10)})` : ''}
                      </span>
                    </td>
                    <td>
                      {log.details ? (
                        <div className="text-[11px] font-mono bg-slate-50 text-slate-700 p-1.5 rounded border border-slate-200 max-w-sm overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
