import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Info,
  Compass,
  AlertTriangle,
  X
} from 'lucide-react';
import { getPublicIncidents } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';
import { TomTomMap, STREET_LEVEL_ZOOM } from '../../components/TomTomMap';
import {
  isTomTomConfigured,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM
} from '../../services/tomtomService';
import { TomTomMapNotice } from '../../components/TomTomMapNotice';

const CIVIC_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Potholes / Damaged Roads' },
  { value: 'waterlogging', label: 'Waterlogging & Flooding' },
  { value: 'drainage_blockage', label: 'Drainage Issues' },
  { value: 'garbage_accumulation', label: 'Garbage & Sanitation' },
  { value: 'streetlight_failure', label: 'Streetlighting' },
  { value: 'broken_footpath', label: 'Footpaths' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'water_leakage', label: 'Pipeline Leakage' },
  { value: 'traffic_signal', label: 'Traffic Signals' },
  { value: 'fallen_tree', label: 'Fallen Trees' },
  { value: 'damaged_public_building', label: 'Public Infrastructure' },
];

export const PublicMapPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [focusedCoords, setFocusedCoords] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const hasTomTom = isTomTomConfigured();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPublicIncidents();
      setIncidents(data || []);
      const withCoords = (data || []).filter(
        (i) => i.latitude && i.longitude && !isNaN(parseFloat(i.latitude)) && !isNaN(parseFloat(i.longitude))
      );
      if (withCoords.length > 0 && !selectedIncident) {
        setSelectedIncident(withCoords[0]);
        setFocusedCoords([parseFloat(withCoords[0].latitude), parseFloat(withCoords[0].longitude)]);
      }
    } catch (err) {
      console.error('Failed to load public map incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    const matchCat = categoryFilter === 'all' || inc.disaster_type === categoryFilter;
    const matchSearch =
      !search.trim() ||
      inc.title?.toLowerCase().includes(search.toLowerCase()) ||
      inc.location?.toLowerCase().includes(search.toLowerCase()) ||
      inc.state?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Handle selecting an issue from list or marker: navigate precisely to exact coordinates
  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    setLocationNotice(null);

    const hasValidCoords = inc.latitude && inc.longitude &&
      !isNaN(parseFloat(inc.latitude)) && !isNaN(parseFloat(inc.longitude));

    if (hasValidCoords) {
      const lat = parseFloat(inc.latitude);
      const lng = parseFloat(inc.longitude);
      setFocusedCoords([lat, lng]);
    } else {
      // Do not guess or fake coordinates; display clear informational notice
      setFocusedCoords(null);
      setLocationNotice({
        title: 'Precise GPS Pin Unavailable',
        message: `This issue does not have verified GPS coordinates. Location is recorded from description: "${inc.location || 'Local area'}".`
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#FF6B58] uppercase tracking-wider">
              Live Geographic Intelligence
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] text-slate-400">TomTom Street Map</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F8FAFC] mt-0.5 break-words">
            Public Civic Map
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Explore verified community issue alerts, road hazards, and municipal progress across sectors. Click any issue to zoom directly to its street location.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Refresh map incidents"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/report"
            className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
          >
            Report an Issue
          </Link>
        </div>
      </div>

      {!hasTomTom && <TomTomMapNotice compact />}

      {/* Location notice banner for non-GPS records */}
      {locationNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">{locationNotice.title}</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">{locationNotice.message}</p>
            </div>
          </div>
          <button
            onClick={() => setLocationNotice(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Map + Sidebar Grid - Responsive on Desktop and Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] lg:h-[680px]">
        {/* Left Side: Incidents List (4 cols desktop, stacked on mobile) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 border border-white/10 flex flex-col justify-between overflow-hidden shadow-xl min-w-0 max-h-[460px] lg:max-h-none order-2 lg:order-1">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Search and Category Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by locality, city, or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input text-xs pl-8 py-2 bg-[#0D1527]/80 w-full"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input text-xs py-1.5 bg-[#0D1527]/80 w-full"
              >
                {CIVIC_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#14213D]">{c.label}</option>
                ))}
              </select>
            </div>

            {/* List count */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-white/5">
              <span>{filteredIncidents.length} issue{filteredIncidents.length !== 1 ? 's' : ''} on map</span>
              <span className="font-mono text-[10px] text-slate-500">Click to fly to street pin</span>
            </div>

            {/* Incidents Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400 font-mono">
                  Loading verified map alerts…
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No published issues match the current filter.
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.incident_id === inc.incident_id;
                  const hasCoords = inc.latitude && inc.longitude &&
                    !isNaN(parseFloat(inc.latitude)) && !isNaN(parseFloat(inc.longitude));

                  return (
                    <div
                      key={inc.incident_id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#1B2A4A] border-[#FF6B58]/80 shadow-[0_4px_16px_rgba(255,107,88,0.25)] ring-1 ring-[#FF6B58]/40'
                          : 'bg-[#14213D]/50 border-white/5 hover:bg-[#14213D] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <DisasterPill type={inc.disaster_type} />
                        <StatusBadge status={inc.current_status} />
                      </div>

                      <h4 className="text-xs font-semibold text-white line-clamp-1 break-words">
                        {inc.title}
                      </h4>

                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mt-1">
                        <div className="flex items-center gap-1 truncate min-w-0">
                          <MapPin className="w-3 h-3 text-[#FF6B58] shrink-0" />
                          <span className="truncate">{inc.location}</span>
                        </div>
                        {hasCoords ? (
                          <span className="font-mono text-[10px] text-emerald-400 shrink-0 font-medium">
                            GPS Pin
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400/80 italic shrink-0">
                            Text Area
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Incident Drawer */}
          {selectedIncident && (
            <div className="pt-3 mt-3 border-t border-white/10 text-xs space-y-2 animate-fade-in shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#FF6B58] font-bold">
                  {selectedIncident.incident_id}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedIncident.report_count || 1} report{(selectedIncident.report_count || 1) !== 1 ? 's' : ''}
                </span>
              </div>
              <h4 className="font-semibold text-white truncate text-xs">{selectedIncident.title}</h4>
              <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                {selectedIncident.public_summary || selectedIncident.summary}
              </p>
              <Link
                to={`/incident/${selectedIncident.incident_id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF6B58] hover:bg-[#FF8575] text-[#0D1527] text-xs font-semibold transition-all shadow-[0_2px_10px_rgba(255,107,88,0.3)]"
              >
                <span>Read Full Incident Bulletin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Map Container (8 cols desktop, full width on mobile) */}
        <div className="lg:col-span-8 glass-panel-elevated rounded-2xl border border-white/15 overflow-hidden relative shadow-2xl h-[420px] sm:h-[480px] lg:h-full order-1 lg:order-2 min-w-0">
          <TomTomMap
            markers={filteredIncidents}
            selectedId={selectedIncident?.incident_id}
            focusedCoords={focusedCoords}
            onMarkerSelect={handleSelectIncident}
            autoFit={!focusedCoords}
            style="main"
            detailLinkPrefix="/incident"
          />
        </div>
      </div>
    </div>
  );
};
