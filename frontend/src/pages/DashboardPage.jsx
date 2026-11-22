import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Layers,
  GitMerge,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  TrendingUp,
  Eye,
  RefreshCw,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { getAdminDashboardStats, getAdminIncidents } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';

const StatCard = ({ label, value, sublabel, icon: Icon, iconColor, borderColor }) => (
  <div className={`card p-4 sm:p-5 flex items-start gap-3 sm:gap-4 border-l-4 ${borderColor || 'border-l-white/20'} border border-white/10 hover:border-white/20 transition-all min-w-0 w-full overflow-hidden`}>
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor || 'bg-white/5 text-[#94A3B8]'}`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5 truncate">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-[#F8FAFC] truncate">{value ?? '—'}</div>
      {sublabel && <div className="text-[10px] sm:text-[11px] text-[#94A3B8]/80 mt-0.5 truncate">{sublabel}</div>}
    </div>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, incidentsData] = await Promise.all([
        getAdminDashboardStats(),
        getAdminIncidents()
      ]);
      setStats(statsData);
      setIncidents(incidentsData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-[#FF6B58] uppercase tracking-wider block">Operational Command</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5 break-words">Operations Overview</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5 max-w-2xl leading-relaxed">
            Real-time civic intelligence, report triage queue, and incident lifecycle status.
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap shrink-0">
          <span className="text-xs text-[#94A3B8]">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{stats?.system_status || 'Operational'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Responsive from mobile (1 col) to widescreen (6 cols) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 w-full min-w-0">
        <StatCard
          label="Total Reports"
          value={stats?.total_submitted_reports}
          sublabel="All citizen dispatches"
          icon={FileText}
          iconColor="bg-blue-500/10 text-blue-400 border border-blue-500/20"
          borderColor="border-l-blue-500"
        />
        <StatCard
          label="Incidents"
          value={stats?.distinct_incidents}
          sublabel="Grouped issues"
          icon={Layers}
          iconColor="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          borderColor="border-l-indigo-500"
        />
        <StatCard
          label="Awaiting Review"
          value={stats?.reports_pending_review}
          sublabel="Pending triage"
          icon={GitMerge}
          iconColor="bg-amber-500/10 text-amber-400 border border-amber-500/20"
          borderColor="border-l-amber-500"
        />
        <StatCard
          label="Active"
          value={stats?.active_incidents}
          sublabel="Under response"
          icon={AlertCircle}
          iconColor="bg-red-500/10 text-red-400 border border-red-500/20"
          borderColor="border-l-red-500"
        />
        <StatCard
          label="Resolved"
          value={stats?.resolved_incidents}
          sublabel="Completed action"
          icon={CheckCircle2}
          iconColor="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          borderColor="border-l-emerald-500"
        />
        <StatCard
          label="Published"
          value={stats?.published_incidents}
          sublabel="Public bulletin"
          icon={Eye}
          iconColor="bg-purple-500/10 text-purple-400 border border-purple-500/20"
          borderColor="border-l-purple-500"
        />
      </section>

      {/* Action Queue & Operational Directives */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
        <Link
          to="/admin/reviews"
          className="card p-4 sm:p-5 flex items-center justify-between hover:border-amber-500/40 transition-all border-l-4 border-l-amber-400 group border border-white/10 min-w-0"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <GitMerge className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Review Queue</div>
              <div className="text-base sm:text-lg font-bold text-[#F8FAFC] mt-0.5 truncate">
                {stats?.reports_pending_review || 0} candidate pair{stats?.reports_pending_review !== 1 ? 's' : ''} awaiting decision
              </div>
              <div className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 line-clamp-1">Compare side-by-side: duplicate, update, or separate issue</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:translate-x-1.5 transition-transform shrink-0 ml-2" />
        </Link>

        <div className="card p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 border-l-4 border-l-blue-400 border border-white/10 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Monitoring & Action</div>
            <div className="text-base sm:text-lg font-bold text-[#F8FAFC] mt-0.5 truncate">
              {stats?.monitoring_incidents || 0} incident{stats?.monitoring_incidents !== 1 ? 's' : ''} under field observation
            </div>
            <div className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 line-clamp-1">Assigned to municipal crews with active progress tracking</div>
          </div>
        </div>
      </section>

      {/* Recent Incidents Table */}
      <section className="card overflow-hidden border border-white/10 w-full min-w-0">
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#F8FAFC] uppercase tracking-wider truncate">Recent Incidents</h2>
            <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 truncate">Most recently updated grouped issues</p>
          </div>
          <Link
            to="/admin/incidents"
            className="text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold flex items-center gap-1 shrink-0 ml-2"
          >
            <span>View all {incidents.length}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#94A3B8] text-xs">Loading incidents database…</div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center text-[#94A3B8] text-xs">No incidents found in current cycle.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Reports</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 8).map((inc) => (
                  <tr key={inc.incident_id}>
                    <td className="font-medium text-[#F8FAFC] max-w-[200px] sm:max-w-xs">
                      <span className="line-clamp-1 break-words">{inc.title}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      <DisasterPill type={inc.disaster_type} />
                    </td>
                    <td className="text-[#94A3B8]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[130px] sm:max-w-[160px]">{inc.location}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={inc.current_status} />
                    </td>
                    <td className="text-[#CBD5E1] font-mono text-xs whitespace-nowrap">
                      {(inc.associated_report_ids || []).length || inc.report_count || 1}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/admin/incidents/${inc.incident_id}`}
                        className="text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold inline-flex items-center gap-1"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
