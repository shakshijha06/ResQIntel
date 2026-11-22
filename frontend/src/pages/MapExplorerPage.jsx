import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Search, 
  Filter, 
  ArrowRight, 
  Info, 
  RefreshCw, 
  Layers,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminIncidents } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';
import { TomTomMap, STREET_LEVEL_ZOOM } from '../components/TomTomMap';
import { 
  isTomTomConfigured, 
  getMaskedApiKey,
  DEFAULT_MAP_CENTER, 
  DEFAULT_MAP_ZOOM 
} from '../services/tomtomService';
import { TomTomMapNotice } from '../components/TomTomMapNotice';

const CIVIC_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Potholes / Roads' },
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

export const MapExplorerPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [focusedCoords, setFocusedCoords] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');

  const hasTomTom = isTomTomConfigured();

  const loadMapData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.disaster_type = categoryFilter;
      if (statusFilter !== 'all') params.operational_status = statusFilter;

      const data = await getAdminIncidents(params);
      setIncidents(data || []);
      const withCoords = (data || []).filter(
        i => i.latitude && i.longitude && !isNaN(parseFloat(i.latitude)) && !isNaN(parseFloat(i.longitude))
      );
      if (withCoords.length > 0 && !selectedIncident) {
        setSelectedIncident(withCoords[0]);
        setFocusedCoords([parseFloat(withCoords[0].latitude), parseFloat(withCoords[0].longitude)]);
      }
    } catch (err) {
      console.error('Failed to load map incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [categoryFilter, statusFilter, priorityFilter]);

  const filteredIncidents = incidents.filter((inc) => {
    if (priorityFilter !== 'all' && (inc.priority || 'normal').toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }
    if (searchLocation.trim()) {
      const q = searchLocation.toLowerCase();
      return (
        inc.title?.toLowerCase().includes(q) ||
        inc.location?.toLowerCase().includes(q) ||
        (inc.state && inc.state.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handle precise navigation to an issue
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
      setFocusedCoords(null);
      setLocationNotice({
        title: 'Coordinates Missing for Incident',
        message: `Incident ${inc.incident_id} has no GPS coordinates recorded. Stored location: "${inc.location || 'Local vicinity'}".`
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#FF6B58] uppercase tracking-wider">
              Operational Command Canvas
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] text-slate-400">TomTom Street Map</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F8FAFC] mt-0.5 break-words">
            Geospatial Incident Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time geospatial intelligence canvas mapping verified citizen reports and cluster locations. Click any issue to zoom directly to its street location.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 text-xs bg-[#14213D] px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${hasTomTom ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300">
              {hasTomTom ? `TomTom Active (${getMaskedApiKey()})` : 'TomTom Key Pending'}
            </span>
          </div>
          <button
            onClick={loadMapData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF6B58]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {!hasTomTom && <TomTomMapNotice compact />}

      {/* Missing coordinates notice */}
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

      {/* Main Map + Sidebar Split View - Fully Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] lg:h-[720px]">
        {/* Left Drawer: Filter and Incident List (4 Cols desktop, stacked on mobile) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 border border-white/10 flex flex-col justify-between overflow-hidden shadow-xl min-w-0 max-h-[460px] lg:max-h-none order-2 lg:order-1">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by city, area, or title..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="form-input text-xs pl-8 py-1.5 bg-[#0D1527]/70 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input text-xs py-1.5 bg-[#0D1527]/70 w-full truncate"
                >
                  {CIVIC_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#14213D]">{c.label}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="form-input text-xs py-1.5 bg-[#0D1527]/70 w-full"
                >
                  <option value="all" className="bg-[#14213D]">All Priorities</option>
                  <option value="urgent" className="bg-[#14213D]">Urgent</option>
                  <option value="high" className="bg-[#14213D]">High</option>
                  <option value="normal" className="bg-[#14213D]">Normal</option>
                  <option value="low" className="bg-[#14213D]">Low</option>
                </select>
              </div>
            </div>

            {/* List count */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-white/5">
              <span>{filteredIncidents.length} issue{filteredIncidents.length !== 1 ? 's' : ''} listed</span>
              <span className="font-mono text-[10px] text-slate-500">Click to focus marker</span>
            </div>

            {/* List of clusters */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">
                  Loading incident markers...
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No incidents match filters.
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
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inc.state || 'Local'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#F8FAFC] line-clamp-1 break-words">
                        {inc.title}
                      </h4>
                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mt-1">
                        <div className="flex items-center gap-1 truncate min-w-0">
                          <MapPin className="w-3 h-3 text-[#FF6B58] shrink-0" />
                          <span className="truncate">{inc.location}</span>
                        </div>
                        {!hasCoords ? (
                          <span className="text-[10px] text-amber-400/80 italic shrink-0">No GPS</span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400 font-medium shrink-0">
                            GPS Pin
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Incident Drawer Quick Preview */}
          {selectedIncident && (
            <div className="pt-3 mt-3 border-t border-white/10 text-xs animate-fade-in shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#FF6B58] font-bold">
                  Selected Focus
                </span>
                <StatusBadge status={selectedIncident.current_status} />
              </div>
              <p className="text-[#F8FAFC] font-semibold truncate text-xs">{selectedIncident.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>{selectedIncident.report_count || 1} associated report(s)</span>
                {selectedIncident.latitude && (
                  <span className="font-mono text-slate-500">
                    ({parseFloat(selectedIncident.latitude).toFixed(3)}, {parseFloat(selectedIncident.longitude).toFixed(3)})
                  </span>
                )}
              </div>
              <Link
                to={`/admin/incidents/${selectedIncident.incident_id}`}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
              >
                <span>Open Incident Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B58]" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: TomTom Map (8 Cols desktop, full width on mobile) */}
        <div className="lg:col-span-8 glass-panel-elevated rounded-2xl border border-white/15 overflow-hidden relative shadow-2xl h-[420px] sm:h-[480px] lg:h-full order-1 lg:order-2 min-w-0">
          <TomTomMap
            markers={filteredIncidents}
            selectedId={selectedIncident?.incident_id}
            focusedCoords={focusedCoords}
            onMarkerSelect={handleSelectIncident}
            autoFit={!focusedCoords}
            style="main"
            detailLinkPrefix="/admin/incidents"
          />
        </div>
      </div>
    </div>
  );
};
