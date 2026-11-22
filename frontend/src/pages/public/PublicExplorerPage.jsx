import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, AlertTriangle, Filter, X, Layers, Clock } from 'lucide-react';
import { getPublicIncidents } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Pothole / Damaged Road' },
  { value: 'broken_footpath', label: 'Broken Footpath or Pavement' },
  { value: 'road_obstruction', label: 'Road Obstruction' },
  { value: 'traffic_signal', label: 'Traffic Signal Problem' },
  { value: 'poor_streetlighting', label: 'Poor Street Lighting / Dark Road' },
  { value: 'waterlogging', label: 'Waterlogging / Flooded Road' },
  { value: 'drainage_blockage', label: 'Blocked or Overflowing Drain' },
  { value: 'water_supply', label: 'Water Supply Interruption' },
  { value: 'water_leakage', label: 'Water Pipeline Leakage' },
  { value: 'garbage_accumulation', label: 'Garbage Accumulation' },
  { value: 'waste_collection', label: 'Irregular Waste Collection' },
  { value: 'overflowing_bins', label: 'Overflowing Garbage Bins' },
  { value: 'illegal_dumping', label: 'Illegal Waste Dumping' },
  { value: 'public_sanitation', label: 'Public Sanitation Problem' },
  { value: 'streetlight_failure', label: 'Streetlight Failure' },
  { value: 'electrical_infrastructure', label: 'Damaged Electrical Infrastructure' },
  { value: 'damaged_public_building', label: 'Damaged Public Building or Facility' },
  { value: 'unsafe_structure', label: 'Unsafe Public Structure' },
  { value: 'broken_facility', label: 'Broken Public Facility' },
  { value: 'fallen_tree', label: 'Fallen Tree' },
  { value: 'air_pollution', label: 'Air Pollution Complaint' },
  { value: 'water_pollution', label: 'Water Pollution' },
  { value: 'flood', label: 'Flooding Emergency' },
  { value: 'fire', label: 'Fire' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'cyclone', label: 'Cyclone / Severe Storm' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATE_OPTIONS = [
  { value: 'all', label: 'All States' },
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
].map(s => typeof s === 'string' ? { value: s, label: s } : s);

export const PublicExplorerPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter, stateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.disaster_type = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (stateFilter !== 'all') params.state = stateFilter;
      if (search.trim()) params.search = search.trim();
      const data = await getPublicIncidents(params);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleReset = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setStateFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = search || categoryFilter !== 'all' || statusFilter !== 'all' || stateFilter !== 'all';

  const sortedIncidents = [...incidents].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    if (sortBy === 'oldest') return new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">Public Incidents Explorer</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5">Browse Reported Issues</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            {loading ? 'Querying records…' : `${incidents.length} verified issue${incidents.length !== 1 ? 's' : ''} currently published for citizen tracking.`}
          </p>
        </div>
        <Link
          to="/report"
          className="btn-primary text-xs shrink-0"
        >
          + Report a Problem
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel rounded-xl p-4 border border-white/10 space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by keywords, street, locality or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10 pr-20 text-xs"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#FF6B58] hover:bg-[#FF8575] text-[#0D1527] font-semibold text-xs rounded-md transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2.5 items-center pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <Filter className="w-3.5 h-3.5 text-[#FF6B58]" /> <span>Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0D1527] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-[#0D1527] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
          >
            {STATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0D1527] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0D1527] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="card py-20 text-center text-xs text-[#94A3B8]">
          Retrieving incidents database…
        </div>
      ) : sortedIncidents.length === 0 ? (
        <div className="card p-12 text-center space-y-3 border border-white/10">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto opacity-75" />
          <h3 className="text-base font-semibold text-[#F8FAFC]">No Matching Issues Found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Try adjusting your search keywords, clear category filters, or{' '}
            <button onClick={handleReset} className="text-[#FF6B58] hover:underline">reset all filters</button>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedIncidents.map((inc) => {
            const reportCount = (inc.associated_report_ids || []).length || inc.report_count || 1;
            return (
              <div
                key={inc.incident_id}
                className="card-elevated p-5 flex flex-col justify-between hover:border-white/25 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <DisasterPill type={inc.disaster_type} />
                    <StatusBadge status={inc.current_status} />
                  </div>

                  <h3 className="font-semibold text-[#F8FAFC] line-clamp-2 text-sm leading-snug group-hover:text-[#FF6B58] transition-colors">
                    {inc.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{inc.location}{inc.state ? `, ${inc.state}` : ''}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                    <Layers className="w-3 h-3 text-[#FF6B58]" />
                    <span>{reportCount} citizen report{reportCount !== 1 ? 's' : ''} organized</span>
                  </div>

                  {(inc.public_summary || inc.summary) && (
                    <p className="text-xs text-[#CBD5E1] line-clamp-2 leading-relaxed">
                      {inc.public_summary || inc.summary}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inc.updated_at || inc.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <Link
                    to={`/incident/${inc.incident_id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
