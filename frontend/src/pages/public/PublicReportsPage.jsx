import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, Filter, MapPin, Clock, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight
} from 'lucide-react';
import { DisasterPill, StatusBadge } from '../../components/StatusBadge';
import api from '../../services/api';

const CIVIC_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Pothole / Damaged Road' },
  { value: 'waterlogging', label: 'Waterlogging & Flooding' },
  { value: 'drainage_blockage', label: 'Drainage Issues' },
  { value: 'garbage_accumulation', label: 'Garbage & Waste' },
  { value: 'streetlight_failure', label: 'Streetlighting' },
  { value: 'broken_footpath', label: 'Footpaths' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'water_leakage', label: 'Pipeline Leakage' },
  { value: 'traffic_signal', label: 'Traffic Signals' },
  { value: 'damaged_public_building', label: 'Infrastructure' },
  { value: 'fallen_tree', label: 'Fallen Trees' },
  { value: 'flood', label: 'Flooding' },
  { value: 'fire', label: 'Fire' },
  { value: 'cyclone', label: 'Cyclone' },
];

const STATES = [
  'All States', 'West Bengal', 'Rajasthan', 'Haryana', 'Karnataka',
  'Maharashtra', 'Tamil Nadu', 'Delhi', 'Telangana', 'Gujarat',
  'Kerala', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Assam', 'Odisha'
];

export const PublicReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [inputSearch, setInputSearch] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = { page, page_size: 20 };
      if (category && category !== 'all') params.disaster_type = category;
      if (state && state !== 'All States') params.state = state;
      if (search) params.search = search;
      const res = await api.get('/public/reports', { params });
      setReports(res.data.reports || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load public reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, [page, category, state, search]);

  const handleSearch = () => { setPage(1); setSearch(inputSearch); };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">Citizen Submissions</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5">Reported Issues</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Browse public civic complaints submitted by community members. {total > 0 ? `(${total} total submissions)` : ''}
          </p>
        </div>
        <Link to="/report" className="btn-primary text-xs shrink-0">
          + Report a Problem
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 border border-white/10 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputSearch}
            onChange={e => setInputSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by keywords or locality..."
            className="form-input text-xs pl-8 pr-20 py-2"
          />
          <button
            onClick={handleSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#FF6B58] hover:bg-[#FF8575] text-[#0D1527] font-semibold text-xs rounded-md transition-colors"
          >
            Search
          </button>
        </div>

        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="bg-[#0D1527] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
        >
          {CIVIC_CATEGORIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <select
          value={state}
          onChange={e => { setState(e.target.value); setPage(1); }}
          className="bg-[#0D1527] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
        >
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Report list */}
      {loading ? (
        <div className="card py-20 text-center text-xs text-[#94A3B8]">Loading civic reports…</div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center space-y-2 border border-white/10">
          <FileText className="w-8 h-8 text-[#94A3B8] mx-auto opacity-60" />
          <p className="text-sm font-semibold text-[#F8FAFC]">No reports found</p>
          <p className="text-xs text-[#94A3B8]">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(rep => (
            <Link
              key={rep.report_id}
              to={`/reports/${rep.report_id}`}
              className="card p-4 hover:border-white/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 block group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#FF6B58] bg-[#FF6B58]/10 px-2 py-0.5 rounded border border-[#FF6B58]/20">
                    {rep.report_id}
                  </span>
                  <DisasterPill type={rep.disaster_type} />
                </div>
                <p className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#FF6B58] transition-colors line-clamp-1">
                  {rep.original_text || 'Civic observation report'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{rep.raw_location || rep.city || 'Location logged'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span>{new Date(rep.created_at || rep.reported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#FF6B58] font-semibold shrink-0">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-xs disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-[#94A3B8]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-xs disabled:opacity-40"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
