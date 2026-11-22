import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPin, Compass, ArrowRight, Layers, Filter, Search, Key, Info } from 'lucide-react';
import { getPublicIncidents } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';

// Clean Ops Pin Marker
const createCivicPin = (priority) => {
  const color = priority === 'urgent' ? '#EF4444' : priority === 'high' ? '#FF6B58' : '#3B82F6';
  return L.divIcon({
    className: 'custom-civic-marker',
    html: `
      <div style="
        position: relative;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.25;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 13px;
          height: 13px;
          background: ${color};
          border: 2px solid #F8FAFC;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
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

export const PublicMapPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mapCenter, setMapCenter] = useState([22.5, 82.5]);
  const [mapZoom, setMapZoom] = useState(5);

  const rawMaptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const isKeyConfigured = rawMaptilerKey && 
    rawMaptilerKey.trim() !== '' && 
    rawMaptilerKey.trim() !== 'your_maptiler_api_key_here';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getPublicIncidents();
        setIncidents(data || []);
      } catch (err) {
        console.error('Failed to load public map incidents:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    const matchCat = categoryFilter === 'all' || inc.disaster_type === categoryFilter;
    const matchSearch = !search.trim() || 
      inc.title?.toLowerCase().includes(search.toLowerCase()) ||
      inc.location?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelect = (inc) => {
    setSelectedIncident(inc);
    if (inc.latitude && inc.longitude) {
      setMapCenter([parseFloat(inc.latitude), parseFloat(inc.longitude)]);
      setMapZoom(12);
    }
  };

  const tileUrl = isKeyConfigured
    ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${rawMaptilerKey}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution = isKeyConfigured
    ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    : '&copy; <a href="https://carto.com/">CartoDB</a> &copy; OpenStreetMap contributors';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F8FAFC]">
            Public Civic Map
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore verified community issue alerts, road hazards, and municipal progress across sectors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="btn-primary text-xs"
          >
            Report an Issue
          </Link>
        </div>
      </div>

      {/* Main Map + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px]">
        {/* Left Side: Incidents List (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 border border-white/10 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by locality or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input text-xs pl-8 py-1.5 bg-[#0D1527]/70"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input text-xs py-1.5 bg-[#0D1527]/70"
              >
                <option value="all" className="bg-[#14213D]">All Categories</option>
                <option value="pothole" className="bg-[#14213D]">Roads & Potholes</option>
                <option value="waterlogging" className="bg-[#14213D]">Waterlogging & Flooding</option>
                <option value="drainage_blockage" className="bg-[#14213D]">Drainage</option>
                <option value="garbage_accumulation" className="bg-[#14213D]">Garbage & Sanitation</option>
                <option value="streetlight_failure" className="bg-[#14213D]">Streetlighting</option>
                <option value="broken_footpath" className="bg-[#14213D]">Footpaths</option>
                <option value="water_supply" className="bg-[#14213D]">Water Supply</option>
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-1">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">Loading map alerts…</div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No published issues match filters.</div>
              ) : (
                filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.incident_id === inc.incident_id;
                  return (
                    <div
                      key={inc.incident_id}
                      onClick={() => handleSelect(inc)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#1B2A4A] border-[#FF6B58]/50 shadow-[0_4px_16px_rgba(20,33,61,0.6)]'
                          : 'bg-[#14213D]/50 border-white/5 hover:bg-[#14213D]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <DisasterPill type={inc.disaster_type} />
                        <StatusBadge status={inc.current_status} />
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">
                        {inc.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <MapPin className="w-3 h-3 text-[#FF6B58] shrink-0" />
                        <span className="truncate">{inc.location}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedIncident && (
            <div className="pt-3 mt-3 border-t border-white/10 text-xs">
              <h4 className="font-semibold text-white truncate">{selectedIncident.title}</h4>
              <p className="text-slate-300 text-[11px] line-clamp-2 mt-0.5 leading-relaxed">
                {selectedIncident.public_summary || selectedIncident.summary}
              </p>
              <Link
                to={`/incident/${selectedIncident.incident_id}`}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#FF6B58] hover:bg-[#FF8575] text-[#0D1527] text-xs font-semibold transition-all shadow-[0_2px_10px_rgba(255,107,88,0.3)]"
              >
                <span>Read Full Incident Bulletin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Map Container (8 cols) */}
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
                  icon={createCivicPin(inc.priority)}
                  eventHandlers={{
                    click: () => setSelectedIncident(inc),
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 max-w-xs text-xs font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1">
                        <DisasterPill type={inc.disaster_type} />
                        <StatusBadge status={inc.current_status} />
                      </div>
                      <h4 className="font-semibold text-white text-sm">
                        {inc.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300">
                        <MapPin className="w-3 h-3 text-[#FF6B58]" />
                        <span>{inc.location} ({inc.state})</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {inc.public_summary || inc.summary}
                      </p>
                      <div className="pt-2 border-t border-white/10 flex justify-end">
                        <Link
                          to={`/incident/${inc.incident_id}`}
                          className="text-xs text-[#FF6B58] font-semibold hover:underline flex items-center gap-1"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
