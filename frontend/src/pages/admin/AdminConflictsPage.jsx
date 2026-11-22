import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  MapPin, RefreshCw, ArrowRight, Eye, Layers 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminConflicts } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';

export const AdminConflictsPage = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadConflicts = async () => {
    try {
      setLoading(true);
      const data = await getAdminConflicts();
      setConflicts(data);
    } catch (err) {
      console.error('Failed to load conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const filtered = conflicts.filter(c => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4EDE0]/10">
        <div>
          <h1 className="font-serif text-3xl text-[#F4EDE0] font-normal">Contradiction & Conflict Desk</h1>
          <p className="text-xs text-[#F4EDE0]/60 mt-1">
            Isolated field discrepancies where independent dispatches present mutually exclusive claims.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#14213D] border border-[#F4EDE0]/15 rounded-xl px-3 py-1.5 text-xs text-[#F4EDE0] focus:outline-none"
          >
            <option value="all">All Conflicts ({conflicts.length})</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={loadConflicts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 text-xs text-[#F4EDE0]/70 border border-[#F4EDE0]/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Non-Suppression Principle:</strong> When field reports conflict, neither observation is erased or discarded.
          Both claims are tracked with source provenance until confirmed or clarified by ground truth.
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#F4EDE0]/40 font-mono">
          Querying contradiction logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-[#F4EDE0]/10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-serif text-[#F4EDE0]">No active conflicts matching filter</p>
          <p className="text-xs text-[#F4EDE0]/40">All collocated reports currently align in status and severity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div
              key={item.conflict_id}
              className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4 hover:border-rose-500/30 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F4EDE0]/10 pb-3">
                <div className="flex items-center gap-2">
                  <DisasterPill type={item.disaster_type} />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                    item.status === 'resolved'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-[11px] text-[#F4EDE0]/40">{item.conflict_id}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#F4EDE0]/50">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B58]" />
                  <span>{item.location}</span>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-lg text-[#F4EDE0]">{item.title}</h3>
                <div className="mt-2 space-y-1">
                  {item.reasons.map((r, i) => (
                    <div key={i} className="text-xs text-rose-300/90 flex items-start gap-2">
                      <span className="text-rose-400">&bull;</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reports pair comparison if available */}
              {item.reports && item.reports.length === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#0D1527]/60 border border-[#F4EDE0]/10 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#F4EDE0]/40">
                      <span>REPORT A: {item.reports[0].report_id}</span>
                      <span>{item.reports[0].language?.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-[#F4EDE0]/80 italic line-clamp-2">
                      "{item.reports[0].original_text}"
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D1527]/60 border border-[#F4EDE0]/10 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#F4EDE0]/40">
                      <span>REPORT B: {item.reports[1].report_id}</span>
                      <span>{item.reports[1].language?.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-[#F4EDE0]/80 italic line-clamp-2">
                      "{item.reports[1].original_text}"
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#F4EDE0]/10 text-xs">
                <span className="text-[#F4EDE0]/40 text-[11px]">
                  Logged: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}
                </span>
                <Link
                  to="/admin/reviews"
                  className="text-xs text-[#FF6B58] hover:underline font-medium flex items-center gap-1"
                >
                  <span>Resolve in Review Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
