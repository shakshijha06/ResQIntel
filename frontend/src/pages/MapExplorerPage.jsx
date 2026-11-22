import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Compass, 
  MapPin, 
  Search, 
  Filter, 
  ArrowRight,
  Info,
  RefreshCw,
  Layers,
  AlertTriangle,
  Key
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminIncidents } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';

// Fix Leaflet default marker assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Ops Marker with pulse effect
const createPinMarker = (priority) => {
  const color = priority === 'urgent' ? '#EF4444' : priority === 'high' ? '#FF6B58' : '#3B82F6';
  return L.divIcon({
    className: 'custom-ops-marker',
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.25;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 14px;
          height: 14px;
          background: ${color};
          border: 2.5px solid #F8FAFC;
          border-radius: 50%;
          box-shadow: 0 0 10px ${color}99;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

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
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  
  const [mapCenter, setMapCenter] = useState([22.5, 82.5]);
  const [mapZoom, setMapZoom] = useState(5);

  const rawMaptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const isKeyConfigured = rawMaptilerKey && 
    rawMaptilerKey.trim() !== '' && 
    rawMaptilerKey.trim() !== 'your_maptiler_api_key_here';

  useEffect(() => {
    loadMapData();
  }, [categoryFilter, statusFilter, priorityFilter]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.disaster_type = categoryFilter;
      if (statusFilter !== 'all') params.operational_status = statusFilter;

      const data = await getAdminIncidents(params);
      setIncidents(data || []);
      if (data && data.length > 0 && !selectedIncident) {
        const withCoords = data.find(i => i.latitude && i.longitude) || data[0];
        setSelectedIncident(withCoords);
      }
    } catch (err) {
      console.error('Failed to load map incidents:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    if (inc.latitude && inc.longitude) {
      setMapCenter([parseFloat(inc.latitude), parseFloat(inc.longitude)]);
      setMapZoom(12);
    }
  };

  // Determine Tile Layer URL
  const tileUrl = isKeyConfigured
    ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${rawMaptilerKey}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution = isKeyConfigured
    ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    : '&copy; <a href="https://carto.com/">CartoDB</a> &copy; OpenStreetMap contributors';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F8FAFC]">
            Operational Geospatial Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial intelligence canvas mapping verified citizen reports and cluster locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-[#14213D] px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isKeyConfigured ? 'bg-blue-400' : 'bg-emerald-400'}`} />
            <span className="text-slate-300">
              {isKeyConfigured ? 'MapTiler Streets v2' : 'CartoDB Voyager (OSM)'}
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

      {/* API Key Configuration Callout if Not Configured */}
      {!isKeyConfigured && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3 text-xs text-blue-200">
          <Key className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white">Map Configuration Note:</strong> MapTiler key is currently not configured. Set <code className="bg-black/30 px-1.5 py-0.5 rounded text-blue-300 font-mono">VITE_MAPTILER_API_KEY</code> in <code className="bg-black/30 px-1.5 py-0.5 rounded text-blue-300 font-mono">frontend/.env</code> to load customized MapTiler vector/street tiles. Using high-resolution CartoDB Voyager fallback in the meantime.
          </div>
        </div>
      )}

      {/* Main Map + Sidebar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Drawer: Filter and Incident List (4 Cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 border border-white/10 flex flex-col justify-between overflow-hidden">
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
                  className="form-input text-xs pl-8 py-1.5 bg-[#0D1527]/70"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input text-xs py-1.5 bg-[#0D1527]/70"
                >
                  {CIVIC_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#14213D]">{c.label}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="form-input text-xs py-1.5 bg-[#0D1527]/70"
                >
                  <option value="all" className="bg-[#14213D]">All Priorities</option>
                  <option value="urgent" className="bg-[#14213D]">Urgent</option>
                  <option value="high" className="bg-[#14213D]">High</option>
                  <option value="normal" className="bg-[#14213D]">Normal</option>
                  <option value="low" className="bg-[#14213D]">Low</option>
                </select>
              </div>
            </div>

            {/* List of clusters */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-1">
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
                  const hasCoords = inc.latitude && inc.longitude;
                  return (
                    <div
                      key={inc.incident_id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#1B2A4A] border-[#FF6B58]/50 shadow-[0_4px_16px_rgba(20,33,61,0.6)]'
                          : 'bg-[#14213D]/50 border-white/5 hover:bg-[#14213D]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <DisasterPill type={inc.disaster_type} />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inc.state || 'Local'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#F8FAFC] line-clamp-1">
                        {inc.title}
                      </h4>
                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mt-1">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#FF6B58] shrink-0" />
                          <span className="truncate">{inc.location}</span>
                        </div>
                        {!hasCoords && (
                          <span className="text-[10px] text-amber-400/80 italic shrink-0">No GPS</span>
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
            <div className="pt-3 mt-3 border-t border-white/10 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#FF6B58] font-bold">
                  Selected Focus
                </span>
                <StatusBadge status={selectedIncident.current_status} />
              </div>
              <p className="text-[#F8FAFC] font-semibold truncate">{selectedIncident.title}</p>
              <Link
                to={`/admin/incidents/${selectedIncident.incident_id}`}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
              >
                <span>Open Incident Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6B58]" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: Leaflet Map Container (8 Cols) */}
        <div className="lg:col-span-8 glass-panel-elevated rounded-2xl border border-white/15 overflow-hidden relative shadow-2xl">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <ChangeView center={mapCenter} zoom={mapZoom} />

            <TileLayer
              attribution={tileAttribution}
              url={tileUrl}
            />

            {filteredIncidents.map((inc) => {
              if (!inc.latitude || !inc.longitude) return null;
              return (
                <Marker
                  key={inc.incident_id}
                  position={[parseFloat(inc.latitude), parseFloat(inc.longitude)]}
                  icon={createPinMarker(inc.priority)}
                  eventHandlers={{
                    click: () => setSelectedIncident(inc),
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 max-w-xs text-xs font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1">
                        <span className="font-mono text-[#FF6B58] text-xs font-bold">
                          {inc.incident_id}
                        </span>
                        <DisasterPill type={inc.disaster_type} />
                      </div>
                      <h4 className="font-semibold text-white text-sm leading-snug">
                        {inc.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300">
                        <MapPin className="w-3 h-3 text-[#FF6B58] shrink-0" />
                        <span>{inc.location} ({inc.state})</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {inc.summary}
                      </p>
                      <div className="pt-2 border-t border-white/10 flex justify-end">
                        <Link
                          to={`/admin/incidents/${inc.incident_id}`}
                          className="text-xs text-[#FF6B58] font-semibold hover:underline flex items-center gap-1"
                        >
                          Open Workspace &rarr;
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-4 left-4 z-[400] glass-pill px-3 py-1.5 rounded-xl text-[10px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
            <Info className="w-3 h-3 text-[#FF6B58]" />
            <span>
              {isKeyConfigured ? 'MapTiler Streets Active' : 'CartoDB Voyager Active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
