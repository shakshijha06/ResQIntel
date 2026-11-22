import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  RefreshCw,
  FileText,
  ArrowRight,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  Filter,
  X,
} from 'lucide-react';
import { getAdminIncidents } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';

const CIVIC_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Potholes / Roads' },
  { value: 'waterlogging', label: 'Waterlogging' },
  { value: 'drainage_blockage', label: 'Drainage Issues' },
  { value: 'garbage_accumulation', label: 'Garbage & Waste' },
  { value: 'streetlight_failure', label: 'Streetlighting' },
  { value: 'broken_footpath', label: 'Footpaths' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'water_leakage', label: 'Pipeline Leakage' },
  { value: 'traffic_signal', label: 'Traffic Signals' },
  { value: 'damaged_public_building', label: 'Public Infrastructure' },
  { value: 'fallen_tree', label: 'Fallen Trees' },
  { value: 'public_sanitation', label: 'Public Sanitation' },
  { value: 'overflowing_bins', label: 'Overflowing Bins' },
  { value: 'illegal_dumping', label: 'Illegal Dumping' },
  { value: 'flood', label: 'Flooding Emergency' },
  { value: 'fire', label: 'Fire Emergency' },
  { value: 'other', label: 'Other Issues' },
];

const CATEGORY_ICONS = {
  pothole: '🚧',
  waterlogging: '🌊',
  drainage_blockage: '🪣',
  garbage_accumulation: '🗑️',
  streetlight_failure: '💡',
  broken_footpath: '🚶',
  water_supply: '🚰',
  water_leakage: '💧',
  traffic_signal: '🚦',
  damaged_public_building: '🏚️',
  fallen_tree: '🌳',
  public_sanitation: '🧹',
  overflowing_bins: '♻️',
  illegal_dumping: '⚠️',
  flood: '🌧️',
  fire: '🔥',
  cyclone: '🌀',
  other: '📋',
};

const getPriorityConfig = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return { label: 'Urgent', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' };
    case 'high':
      return { label: 'High', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' };
    case 'low':
      return { label: 'Low', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/20', dot: 'bg-slate-500' };
    default:
      return { label: 'Normal', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return <Activity className="w-3.5 h-3.5 text-rose-400" />;
    case 'in_progress': return <Activity className="w-3.5 h-3.5 text-amber-400" />;
    case 'monitoring': return <Eye className="w-3.5 h-3.5 text-blue-400" />;
    case 'resolved': return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  }
};

const IncidentCard = ({ inc }) => {
  const reportCount = (inc.associated_report_ids || []).length || inc.report_count || 1;
  const priority = getPriorityConfig(inc.priority);
  const categoryIcon = CATEGORY_ICONS[inc.disaster_type] || '📋';
  const updatedDate = new Date(inc.updated_at || inc.created_at);
  const daysAgo = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <div className="group relative flex flex-col bg-[#14213D] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6B58]/30 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Priority stripe */}
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${
          inc.priority === 'urgent' ? 'bg-rose-500' :
          inc.priority === 'high' ? 'bg-amber-500' :
          inc.priority === 'low' ? 'bg-slate-600' :
          'bg-blue-500/60'
        }`}
      />

      {/* Card Header */}
      <div className="pl-5 pr-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Category Emoji */}
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0 group-hover:bg-white/8 transition-colors">
            {categoryIcon}
          </div>
          <div className="min-w-0">
            <Link
              to={`/admin/incidents/${inc.incident_id}`}
              className="block font-semibold text-sm text-[#F8FAFC] leading-snug group-hover:text-[#FF6B58] transition-colors line-clamp-2"
            >
              {inc.title}
            </Link>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <MapPin className="w-3 h-3 shrink-0 text-blue-400" />
              <span className="truncate">{inc.location}{inc.state ? `, ${inc.state}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Priority Badge */}
        <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priority.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5" />

      {/* Category + Status Row */}
      <div className="pl-5 pr-4 py-2.5 flex items-center gap-2 flex-wrap">
        <DisasterPill type={inc.disaster_type} />
        <div className="flex items-center gap-1 ml-auto">
          {getStatusIcon(inc.current_status)}
          <StatusBadge status={inc.current_status} />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5" />

      {/* Footer Row */}
      <div className="pl-5 pr-4 py-3 flex items-center justify-between">
        {/* Report count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
            <FileText className="w-3.5 h-3.5 text-[#FF6B58]" />
            <span className="text-xs font-bold text-[#F8FAFC]">{reportCount}</span>
            <span className="text-[11px] text-[#94A3B8]">{reportCount === 1 ? 'report' : 'reports'}</span>
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLabel}
          </div>
        </div>

        {/* Action */}
        <Link
          to={`/admin/incidents/${inc.incident_id}`}
          className="flex items-center gap-1 text-xs font-semibold text-[#FF6B58] hover:text-[#FF8575] transition-colors group/btn"
        >
          Manage
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-[#FF6B58]/20" />
    </div>
  );
};

export const IncidentExplorerPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [categoryFilter, statusFilter, stateFilter]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.disaster_type = categoryFilter;
      if (statusFilter !== 'all') params.operational_status = statusFilter;
      if (stateFilter !== 'all') params.state = stateFilter;
      if (search.trim()) params.search = search.trim();
      const data = await getAdminIncidents(params);
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadIncidents();
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setStateFilter('all');
    setSearch('');
  };

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all' || stateFilter !== 'all' || search.trim();

  // Stats
  const activeCount = incidents.filter(i => ['active', 'in_progress'].includes(i.current_status)).length;
  const resolvedCount = incidents.filter(i => i.current_status === 'resolved').length;
  const urgentCount = incidents.filter(i => i.priority === 'urgent').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-bold text-[#FF6B58] uppercase tracking-widest">Operations Centre</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-1">Incident Registry</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Grouped civic issues organised by location and type for coordinated resolution.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-4 text-xs text-[#94A3B8]">
            <div className="text-center">
              <div className="font-bold text-lg text-[#F8FAFC] font-mono">{incidents.length}</div>
              <div className="text-[10px] uppercase tracking-wider">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-amber-400 font-mono">{activeCount}</div>
              <div className="text-[10px] uppercase tracking-wider">Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-rose-400 font-mono">{urgentCount}</div>
              <div className="text-[10px] uppercase tracking-wider">Urgent</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-emerald-400 font-mono">{resolvedCount}</div>
              <div className="text-[10px] uppercase tracking-wider">Resolved</div>
            </div>
          </div>
          <button
            onClick={loadIncidents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filter Controls */}
      <div className="glass-panel rounded-xl p-4 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, locality, city, or summary…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9 text-xs w-full"
              />
            </div>
            <button type="submit" className="btn-primary text-xs py-2 px-4 shrink-0">
              Search
            </button>
          </form>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-[#FF6B58]/40 bg-[#FF6B58]/10 text-[#FF6B58]'
                  : 'border-white/15 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-[#FF6B58] text-[#0D1527] text-[9px] font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-[#0D1527] text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
              >
                {CIVIC_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-[#0D1527] text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
              >
                <option value="all">All Statuses</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">State</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-[#0D1527] text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
              >
                <option value="all">All States</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Haryana">Haryana</option>
                <option value="Telangana">Telangana</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Assam">Assam</option>
                <option value="Odisha">Odisha</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Incidents Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-[#14213D] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-20 text-center">
          <Layers className="w-12 h-12 text-[#94A3B8] mx-auto mb-4 opacity-30" />
          <p className="text-sm text-[#94A3B8]">No incidents found matching the current filters.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-[#FF6B58] hover:text-[#FF8575] underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results summary */}
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>
              Showing <span className="font-semibold text-[#F8FAFC]">{incidents.length}</span> incident{incidents.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' (filtered)' : ''}
            </span>
            <span className="font-mono text-[11px] text-[#64748B]">
              Sorted by most recently updated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {incidents.map((inc) => (
              <IncidentCard key={inc.incident_id} inc={inc} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
