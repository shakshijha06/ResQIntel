import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  X, 
  RefreshCw, 
  ExternalLink, 
  Tag, 
  AlertTriangle, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { getAdminReports } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';
import { TomTomMap } from '../components/TomTomMap';

const CIVIC_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Pothole / Damaged Road' },
  { value: 'waterlogging', label: 'Waterlogging / Flooding' },
  { value: 'drainage_blockage', label: 'Drainage Blockage' },
  { value: 'garbage_accumulation', label: 'Garbage Accumulation' },
  { value: 'overflowing_bins', label: 'Overflowing Bins' },
  { value: 'illegal_dumping', label: 'Illegal Dumping' },
  { value: 'streetlight_failure', label: 'Streetlight Failure' },
  { value: 'broken_footpath', label: 'Broken Footpath' },
  { value: 'water_supply', label: 'Water Supply Issue' },
  { value: 'water_leakage', label: 'Pipeline Leakage' },
  { value: 'traffic_signal', label: 'Traffic Signal' },
  { value: 'damaged_public_building', label: 'Public Infrastructure' },
  { value: 'fallen_tree', label: 'Fallen Tree' },
  { value: 'flood', label: 'Flooding Emergency' },
  { value: 'fire', label: 'Fire Emergency' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'other', label: 'Other' },
];

export const ReportsManagementPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, [categoryFilter, stateFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.disaster_type = categoryFilter;
      if (stateFilter !== 'all') params.state = stateFilter;
      if (search.trim()) params.search = search.trim();

      const data = await getAdminReports(params);
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReports();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">Operational Triage</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5">Reported Issues</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Complete database of citizen reports submitted via the public portal and field dispatches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#94A3B8] font-mono">
            {reports.length} Reports Logged
          </span>
          <button
            onClick={loadReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-xl p-4 border border-white/10 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords, location, or report ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 text-xs"
            />
          </div>
          <button type="submit" className="btn-primary text-xs py-2">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8] font-medium">Category:</span>
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
            <span className="text-xs text-[#94A3B8] font-medium">State:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-[#0D1527] text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
            >
              <option value="all">All States</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Haryana">Haryana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Delhi">Delhi</option>
              <option value="Telangana">Telangana</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Kerala">Kerala</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Bihar">Bihar</option>
              <option value="Assam">Assam</option>
              <option value="Odisha">Odisha</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden border border-white/10">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#94A3B8]">Loading citizen reports…</div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#94A3B8]">
            No reports match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Grouped Incident</th>
                  <th>Date Logged</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr key={rep.report_id} className="hover:bg-white/[0.02]">
                    <td className="font-mono text-xs font-semibold text-[#FF6B58] whitespace-nowrap">
                      <Link to={`/admin/reports/${rep.report_id}`} className="hover:underline">
                        {rep.report_id}
                      </Link>
                    </td>
                    <td>
                      <DisasterPill type={rep.disaster_type} />
                    </td>
                    <td className="max-w-xs">
                      <p className="text-xs text-[#CBD5E1] line-clamp-2 leading-relaxed">
                        {rep.original_text || 'No description provided.'}
                      </p>
                    </td>
                    <td className="text-xs text-[#94A3B8]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {rep.raw_location || rep.city || rep.state || 'Local area'}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs">
                      {rep.associated_incident_id ? (
                        <Link
                          to={`/admin/incidents/${rep.associated_incident_id}`}
                          className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {rep.associated_incident_id}
                        </Link>
                      ) : (
                        <span className="text-[#94A3B8]/60 text-xs font-mono">Unassigned</span>
                      )}
                    </td>
                    <td className="text-xs text-[#94A3B8] whitespace-nowrap">
                      {new Date(rep.created_at || rep.reported_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReport(rep)}
                          className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] font-medium px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                        >
                          Inspect
                        </button>
                        <Link
                          to={`/admin/reports/${rep.report_id}`}
                          className="text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold"
                        >
                          Profile →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Quick Inspection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="card-elevated max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF6B58] block">
                  {selectedReport.report_id}
                </span>
                <h3 className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                  Citizen Report Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <DisasterPill type={selectedReport.disaster_type} />
                <span className="text-xs text-[#94A3B8]">
                  Logged: {new Date(selectedReport.created_at || selectedReport.reported_at).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
                  Citizen's Description (Verbatim)
                </label>
                <p className="p-3.5 bg-[#0D1527] rounded-xl border border-white/10 text-[#F8FAFC] leading-relaxed italic text-xs sm:text-sm font-sans">
                  "{selectedReport.original_text}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block">Location Given</span>
                  <span className="font-medium text-[#F8FAFC]">{selectedReport.raw_location || 'Not specified'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block">City & State</span>
                  <span className="font-medium text-[#F8FAFC]">{selectedReport.city || ''} {selectedReport.state ? `(${selectedReport.state})` : ''}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block">Coordinates</span>
                  <span className="font-mono text-[#F8FAFC]">
                    {selectedReport.latitude ? `${selectedReport.latitude}, ${selectedReport.longitude}` : 'Not pinned'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block">Associated Incident</span>
                  <span className="font-mono font-medium text-blue-400">
                    {selectedReport.associated_incident_id || 'Provisional'}
                  </span>
                </div>
              </div>

              {selectedReport.latitude && selectedReport.longitude && !isNaN(parseFloat(selectedReport.latitude)) && (
                <div className="rounded-xl overflow-hidden border border-white/10 h-[170px] relative">
                  <TomTomMap
                    center={[parseFloat(selectedReport.latitude), parseFloat(selectedReport.longitude)]}
                    zoom={15}
                    markers={[{
                      id: selectedReport.report_id,
                      report_id: selectedReport.report_id,
                      latitude: selectedReport.latitude,
                      longitude: selectedReport.longitude,
                      title: selectedReport.raw_location || selectedReport.disaster_type,
                      location: selectedReport.raw_location || selectedReport.city,
                      disaster_type: selectedReport.disaster_type,
                      priority: 'high'
                    }]}
                    height="100%"
                    interactive={true}
                    showNoticeIfMissing={false}
                  />
                  <div className="absolute bottom-2 right-2 z-[1000] bg-[#14213D]/90 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-slate-300 border border-white/10 pointer-events-none">
                    TomTom Pin Preview
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <Link
                to={`/admin/reports/${selectedReport.report_id}`}
                className="btn-primary text-xs"
              >
                Open Full Report Profile →
              </Link>
              <button
                onClick={() => setSelectedReport(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
