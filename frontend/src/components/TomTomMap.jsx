import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, AlertCircle, Compass, Layers } from 'lucide-react';
import {
  getTomTomTileUrl,
  TOMTOM_ATTRIBUTION,
  isTomTomConfigured,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM
} from '../services/tomtomService';
import { StatusBadge, DisasterPill } from './StatusBadge';
import { TomTomMapNotice } from './TomTomMapNotice';

// Street-level zoom target for individual civic issues
export const STREET_LEVEL_ZOOM = 16;

// Create distinguishable civic markers with prominent selection halo
export const createTomTomCivicPin = (priority = 'normal', isSelected = false) => {
  const p = (priority || 'normal').toLowerCase();
  const baseColor = p === 'urgent' ? '#EF4444' : p === 'high' ? '#FF6B58' : p === 'low' ? '#64748B' : '#3B82F6';
  const size = isSelected ? 38 : 28;
  const dotSize = isSelected ? 16 : 12;

  if (isSelected) {
    return L.divIcon({
      className: 'custom-tomtom-marker selected-civic-marker',
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
        ">
          <!-- Animated Radar Beacon -->
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #FF6B58;
            opacity: 0.35;
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid #FF6B58;
            background: rgba(255, 107, 88, 0.2);
          "></div>
          <!-- Center Pin -->
          <div style="
            position: relative;
            width: ${dotSize}px;
            height: ${dotSize}px;
            background: #FF6B58;
            border: 2.5px solid #F8FAFC;
            border-radius: 50%;
            box-shadow: 0 0 14px rgba(255, 107, 88, 0.9), 0 3px 8px rgba(0,0,0,0.7);
          "></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  return L.divIcon({
    className: 'custom-tomtom-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          width: ${size - 4}px;
          height: ${size - 4}px;
          border-radius: 50%;
          background: ${baseColor};
          opacity: 0.22;
          animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: ${dotSize}px;
          height: ${dotSize}px;
          background: ${baseColor};
          border: 2px solid #F8FAFC;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Component that manages camera flight, initial auto-fit, and container resizing
function MapController({
  focusCoords,
  focusZoom = STREET_LEVEL_ZOOM,
  bounds,
  shouldFitBounds = false,
  onBoundsFitted
}) {
  const map = useMap();
  const hasInitiallyFitted = useRef(false);

  // Auto-resize handler for responsive layouts and sidebar collapse/expand
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    let resizeTimer = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        try {
          map.invalidateSize({ animate: false });
        } catch (e) {
          // container might be unmounting
        }
      }, 60);
    });

    observer.observe(container);

    // Initial size calculation
    map.invalidateSize({ animate: false });

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [map]);

  // Initial bounds fit (runs once when markers first load or filter resets)
  useEffect(() => {
    if (shouldFitBounds && bounds && bounds.length > 0 && !hasInitiallyFitted.current) {
      hasInitiallyFitted.current = true;
      try {
        if (bounds.length === 1) {
          map.setView(bounds[0], focusZoom, { animate: true });
        } else {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
        }
        if (onBoundsFitted) onBoundsFitted();
      } catch (err) {
        console.warn('Map bounds fit error:', err);
      }
    }
  }, [bounds, shouldFitBounds, focusZoom, map, onBoundsFitted]);

  // Smooth camera flight to exact issue coordinates
  useEffect(() => {
    if (focusCoords && !isNaN(focusCoords[0]) && !isNaN(focusCoords[1])) {
      try {
        map.flyTo(focusCoords, focusZoom, {
          animate: true,
          duration: 1.1,
          easeLinearity: 0.25
        });
      } catch (err) {
        console.warn('Map flyTo error:', err);
      }
    }
  }, [focusCoords, focusZoom, map]);

  return null;
}

export const TomTomMap = ({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  markers = [],
  selectedId = null,
  focusedCoords = null, // [lat, lng] when an issue is explicitly selected
  onMarkerSelect = null,
  height = '100%',
  style = 'main', // 'main' or 'night'
  autoFit = false,
  showNoticeIfMissing = true,
  interactive = true,
  detailLinkPrefix = '/explore'
}) => {
  const hasTomTom = isTomTomConfigured();
  const markerRefs = useRef({});
  const [shouldAutoFit, setShouldAutoFit] = useState(autoFit && !selectedId);

  // Parse valid coordinates
  const validMarkers = markers.filter(
    (m) => m && m.latitude && m.longitude &&
           !isNaN(parseFloat(m.latitude)) && !isNaN(parseFloat(m.longitude))
  );

  const markerBounds = validMarkers.map((m) => [parseFloat(m.latitude), parseFloat(m.longitude)]);

  // Derive target coordinates: prioritize explicitly passed focusedCoords, or coordinates of selectedId
  let activeFocusCoords = null;
  if (focusedCoords && !isNaN(focusedCoords[0]) && !isNaN(focusedCoords[1])) {
    activeFocusCoords = focusedCoords;
  } else if (selectedId) {
    const selectedItem = validMarkers.find(
      (m) => m.id === selectedId || m.incident_id === selectedId || m.report_id === selectedId
    );
    if (selectedItem) {
      activeFocusCoords = [parseFloat(selectedItem.latitude), parseFloat(selectedItem.longitude)];
    }
  }

  // Open marker popup when selection changes
  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      const markerInstance = markerRefs.current[selectedId];
      if (markerInstance && typeof markerInstance.openPopup === 'function') {
        const timer = setTimeout(() => {
          markerInstance.openPopup();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedId]);

  if (!hasTomTom && showNoticeIfMissing) {
    return (
      <div
        className="w-full h-full min-h-[300px] rounded-2xl bg-[#0D1527] border border-white/10 flex flex-col items-center justify-center p-6 text-center shadow-inner"
        style={{ height }}
      >
        <TomTomMapNotice />
      </div>
    );
  }

  const initialCenter = activeFocusCoords || center || DEFAULT_MAP_CENTER;

  return (
    <div
      className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-white/10 relative shadow-lg"
      style={{ height }}
    >
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          url={getTomTomTileUrl(style)}
          attribution={TOMTOM_ATTRIBUTION}
          maxZoom={22}
        />

        <MapController
          focusCoords={activeFocusCoords}
          focusZoom={STREET_LEVEL_ZOOM}
          bounds={markerBounds}
          shouldFitBounds={shouldAutoFit}
          onBoundsFitted={() => setShouldAutoFit(false)}
        />

        {validMarkers.map((m) => {
          const lat = parseFloat(m.latitude);
          const lng = parseFloat(m.longitude);
          const markerKey = m.incident_id || m.report_id || m.id || `${lat}_${lng}`;
          const isSelected = selectedId && (
            m.id === selectedId ||
            m.incident_id === selectedId ||
            m.report_id === selectedId
          );
          const pin = createTomTomCivicPin(m.priority, isSelected);

          return (
            <Marker
              key={markerKey}
              position={[lat, lng]}
              icon={pin}
              zIndexOffset={isSelected ? 1000 : 0}
              ref={(el) => {
                if (el) {
                  markerRefs.current[markerKey] = el;
                  if (m.incident_id) markerRefs.current[m.incident_id] = el;
                  if (m.report_id) markerRefs.current[m.report_id] = el;
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onMarkerSelect) onMarkerSelect(m);
                }
              }}
            >
              <Popup className="tomtom-custom-popup">
                <div className="space-y-2 p-1 max-w-xs text-xs font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <span className="font-mono text-[10px] text-[#FF6B58] font-bold">
                      {m.incident_id || m.report_id || 'CIVIC ISSUE'}
                    </span>
                    {m.current_status && <StatusBadge status={m.current_status} />}
                  </div>

                  <div className="font-semibold text-[#F8FAFC] text-sm leading-snug break-words">
                    {m.title || m.original_text || 'Reported Civic Problem'}
                  </div>

                  <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{m.location || m.raw_location || m.city || 'Location logged'}</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    {m.disaster_type && <DisasterPill type={m.disaster_type} />}
                    {(m.incident_id || m.report_id) && (
                      <Link
                        to={`${detailLinkPrefix}/${m.incident_id || m.report_id}`}
                        className="text-[11px] font-semibold text-[#FF6B58] hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
