import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Clock, User, Search, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import api from '../../services/api';

const ACTION_LABELS = {
  create_user: 'User Created',
  toggle_user_status: 'User Status Changed',
  submit_review_decision: 'Review Decision',
  update_incident: 'Incident Updated',
  create_incident: 'Incident Created',
  process_report_extraction: 'AI Extraction Run',
  login: 'Login',
  logout: 'Logout',
};

const ACTION_COLORS = {
  create_user: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  toggle_user_status: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  submit_review_decision: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  update_incident: 'text-[#FF6B58] bg-[#FF6B58]/10 border-[#FF6B58]/20',
  create_incident: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  process_report_extraction: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  login: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  logout: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
};

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, page_size: 50 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (search) params.user_email = search;
      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, search]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') { setPage(1); loadLogs(); }
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4EDE0]/10">
        <div>
          <h1 className="font-serif text-3xl text-[#F4EDE0] font-normal">Audit Log</h1>
          <p className="text-xs text-[#F4EDE0]/50 mt-1">
            Immutable record of significant administrative actions. {total.toLocaleString()} entries total.
          </p>
        </div>
        <button
          onClick={() => { setPage(1); loadLogs(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 border border-[#F4EDE0]/10 text-xs text-[#F4EDE0]/70 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 border border-[#F4EDE0]/10 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-[#0D1527]/60 border border-[#F4EDE0]/10 rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-[#F4EDE0]/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Filter by user email..."
            className="bg-transparent text-xs text-[#F4EDE0] placeholder-[#F4EDE0]/30 outline-none w-full"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-[#0D1527]/60 border border-[#F4EDE0]/10 rounded-lg px-3 py-2 text-xs text-[#F4EDE0] outline-none"
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_LABELS).map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          className="bg-[#0D1527]/60 border border-[#F4EDE0]/10 rounded-lg px-3 py-2 text-xs text-[#F4EDE0] outline-none"
        >
          <option value="">All Entities</option>
          {['user', 'incident', 'report', 'review', 'dataset'].map(e => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="glass-panel rounded-2xl border border-[#F4EDE0]/10 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#F4EDE0]/40">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#F4EDE0]/20 mx-auto" />
            <p className="text-xs text-[#F4EDE0]/40">No audit records match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F4EDE0]/10 text-[#F4EDE0]/40 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EDE0]/5">
                {logs.map(log => (
                  <tr key={log.log_id} className="hover:bg-[#F4EDE0]/3 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#F4EDE0]/50 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#F4EDE0]/30" />
                        <span className="text-[#F4EDE0]/70">{log.user_email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium ${
                        ACTION_COLORS[log.action] || 'text-[#F4EDE0]/60 bg-[#F4EDE0]/5 border-[#F4EDE0]/10'
                      }`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-[#F4EDE0]/60">{log.entity_type}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#F4EDE0]/50">{log.entity_id}</td>
                    <td className="py-3 px-4 text-[#F4EDE0]/50 max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F4EDE0]/10 text-xs text-[#F4EDE0]/50">
            <span>Page {page} of {totalPages} · {total} total records</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F4EDE0]/5 border border-[#F4EDE0]/10 text-[11px] text-[#F4EDE0]/40">
        <Shield className="w-3.5 h-3.5 mt-0.5 text-[#FF6B58] shrink-0" />
        <span>
          Audit records are append-only. Standard administrators cannot modify or delete log entries.
          Passwords, tokens, and other secrets are never recorded in audit logs.
        </span>
      </div>
    </div>
  );
};
