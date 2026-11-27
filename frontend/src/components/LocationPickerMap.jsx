import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  MapPin,
  Crosshair,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Compass,
  Navigation
} from 'lucide-react';
import {
  getTomTomTileUrl,
  TOMTOM_ATTRIBUTION,
  searchPlaces,
  reverseGeocode,
  isTomTomConfigured,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM
} from '../services/tomtomService';
import { TomTomMapNotice } from './TomTomMapNotice';

// Custom SVG Pulsing Pin for selection
const createLocationPickerIcon = () => {
  return L.divIcon({
    className: 'custom-picker-pin',
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -100%);
        cursor: grab;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FF6B58;
          opacity: 0.25;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#FF6B58"/>
          <circle cx="17" cy="16" r="6" fill="#0D1527"/>
          <circle cx="17" cy="16" r="3.5" fill="#F8FAFC"/>
        </svg>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
};

const pickerIcon = createLocationPickerIcon();

// Map helper to update center and zoom smoothly
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map event listener for clicks
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationPickerMap = ({
  latitude,
  longitude,
  onLocationChange,
  initialAddress = ''
}) => {
  const hasTomTom = isTomTomConfigured();

  // Coordinates state
  const hasValidCoords = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
  const currentLat = hasValidCoords ? parseFloat(latitude) : DEFAULT_MAP_CENTER[0];
  const currentLng = hasValidCoords ? parseFloat(longitude) : DEFAULT_MAP_CENTER[1];

  const [mapCenter, setMapCenter] = useState([currentLat, currentLng]);
  const [mapZoom, setMapZoom] = useState(hasValidCoords ? 15 : DEFAULT_MAP_ZOOM);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Geolocation state
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null);

  // Reverse geocoding status
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [lastResolvedAddress, setLastResolvedAddress] = useState(initialAddress);

  const debounceTimerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const markerRef = useRef(null);

  // Keep mapCenter in sync when coordinates change from outside
  useEffect(() => {
    if (hasValidCoords) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      setMapCenter([lat, lng]);
    }
  }, [latitude, longitude, hasValidCoords]);

  // Reset keyboard highlight whenever suggestions list updates
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Close suggestions when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle address reverse-geocoding when coordinates change
  const resolveAddressFromCoords = async (lat, lng) => {
    if (!hasTomTom) {
      onLocationChange({
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      });
      return;
    }

    try {
      setReverseGeocoding(true);
      const res = await reverseGeocode(lat, lng);
      setLastResolvedAddress(res.formattedAddress);

      onLocationChange({
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        raw_location: res.formattedAddress || res.street || '',
        street: res.street || '',
        city: res.city || '',
        district: res.district || '',
        state: res.state || '',
        postalCode: res.postalCode || ''
      });
    } catch (err) {
      // Still update lat/lng even if reverse geocode fails
      onLocationChange({
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      });
    } finally {
      setReverseGeocoding(false);
    }
  };

  // Debounced places search
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(val, {
          lat: mapCenter[0],
          lon: mapCenter[1],
          limit: 6
        });
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        if (err.message === 'TOMTOM_API_KEY_MISSING') {
          setSearchError('TomTom API key required for live place search.');
        } else if (err.message === 'TOMTOM_API_KEY_INVALID') {
          setSearchError('Invalid TomTom API key in .env.local.');
        } else if (err.message === 'TOMTOM_RATE_LIMITED') {
          setSearchError('TomTom rate limit reached. Try again in a moment.');
        } else {
          setSearchError('Unable to search places right now.');
        }
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Selecting a search suggestion
  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.title);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIndex(-1);

    const newLat = parseFloat(item.latitude);
    const newLng = parseFloat(item.longitude);

    setMapCenter([newLat, newLng]);
    setMapZoom(16);
    setLastResolvedAddress(item.formattedAddress);

    onLocationChange({
      latitude: newLat.toFixed(6),
      longitude: newLng.toFixed(6),
      raw_location: item.formattedAddress || item.title,
      street: item.street || item.title || '',
      city: item.city || '',
      district: item.district || '',
      state: item.state || '',
      postalCode: item.postalCode || ''
    });
  };

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setShowSuggestions(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  // Current location handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice({
        type: 'error',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setMapCenter([lat, lng]);
        setMapZoom(16);
        setGeoNotice({
          type: 'success',
          message: 'Centered on your current position. If the issue is elsewhere, drag the pin or search the location.'
        });

        await resolveAddressFromCoords(lat, lng);
      },
      (err) => {
        setLocating(false);
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) {
          msg = 'Location permission was denied. You can search or click the map manually.';
        } else if (err.code === 2) {
          msg = 'Position unavailable. Please search your address above.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please try again or search manually.';
        }
        setGeoNotice({ type: 'warning', message: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Map click
  const handleMapClick = (lat, lng) => {
    setMapCenter([lat, lng]);
    resolveAddressFromCoords(lat, lng);
  };

  // Marker drag end
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      setMapCenter([pos.lat, pos.lng]);
      resolveAddressFromCoords(pos.lat, pos.lng);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Current Location Bar */}
      <div className="space-y-2 relative z-20" ref={searchContainerRef}>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Places Search Input */}
          <div className="relative flex-1 z-20">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search street, locality, landmark, city, or PIN code (TomTom)..."
              className="form-input pl-9 pr-9 text-xs w-full bg-[#0D1527] border-white/15 focus:border-[#FF6B58]"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 text-[#FF6B58] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            {!isSearching && searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setHighlightedIndex(-1);
                }}
                className="p-1 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                aria-label="Clear location search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#14213D] border border-white/20 rounded-xl shadow-2xl overflow-hidden max-h-60 sm:max-h-64 overflow-y-auto overscroll-contain"
                style={{
                  boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <span>TomTom Search Suggestions</span>
                  <span className="text-[9px] text-slate-500 lowercase">{suggestions.length} results</span>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2.5 group cursor-pointer ${
                      highlightedIndex === idx ? 'bg-white/15' : 'hover:bg-white/10'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B58] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#F8FAFC] truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Use My Current Location Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="btn-secondary text-xs py-2 px-3 shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap border-white/20 hover:border-[#FF6B58]/40"
            title="Locate via browser GPS"
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B58]" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-[#FF6B58]" />
            )}
            <span>Use My Location</span>
          </button>
        </div>

        {/* Search error if any */}
        {searchError && (
          <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Geolocation Notice */}
        {geoNotice && (
          <div
            className={`p-2.5 rounded-xl border text-[11px] flex items-start justify-between gap-2 animate-fade-in ${
              geoNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                : geoNotice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-1.5">
              <Compass className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{geoNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeoNotice(null)}
              className="text-slate-400 hover:text-white p-0.5 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="rounded-xl overflow-hidden border border-white/15 h-[300px] relative z-0 isolate bg-[#0A1120] shadow-inner">
        {hasTomTom ? (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url={getTomTomTileUrl('main')}
              attribution={TOMTOM_ATTRIBUTION}
              maxZoom={22}
            />
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapEventsHandler onMapClick={handleMapClick} />
            {hasValidCoords && (
              <Marker
                position={[parseFloat(latitude), parseFloat(longitude)]}
                icon={pickerIcon}
                draggable={true}
                ref={markerRef}
                eventHandlers={{
                  dragend: handleMarkerDragEnd
                }}
              />
            )}
          </MapContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#0D1527]/90">
            <TomTomMapNotice compact />
            <p className="text-xs text-slate-400 max-w-sm">
              You can still manually enter the address and coordinates below. Once your TomTom key is placed in <code className="text-emerald-400">frontend/.env.local</code>, the street map and place search will activate automatically.
            </p>
          </div>
        )}

        {/* Pin action guidance overlay */}
        <div className="absolute top-2.5 right-2.5 z-[1000] bg-[#14213D]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-300 shadow-md flex items-center gap-1.5 pointer-events-none">
          <Navigation className="w-3 h-3 text-[#FF6B58]" />
          <span>Click map or drag pin to adjust</span>
        </div>

        {/* Loading address indicator */}
        {reverseGeocoding && (
          <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-[#14213D]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs text-slate-200 shadow-lg flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-[#FF6B58] animate-spin" />
            <span>Resolving address with TomTom...</span>
          </div>
        )}
      </div>

      {/* Selected Coordinates & Address Quick View */}
      {hasValidCoords && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Selected Point:</span>
            <span className="font-mono text-[#FF6B58] font-semibold">
              {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
            </span>
          </div>
          {lastResolvedAddress && (
            <div className="text-slate-300 truncate max-w-xs sm:max-w-md">
              📍 {lastResolvedAddress}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
