import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Maximize2 } from 'lucide-react';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type?: 'truck' | 'source' | 'delivery' | 'hub' | 'report';
  popupContent?: string;
  etaMin?: number;
  subLabel?: string;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routePolyline?: [number, number][];
  traveledPolyline?: [number, number][];
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  transitProgressPct?: number;
  isDelivered?: boolean;
  isArrived?: boolean;
  className?: string;
  autoFitBounds?: boolean;
  followTruck?: boolean;
  showMapControls?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

interface LatLngPoint {
  lat: number;
  lng: number;
}

function interpolateAlongPath(path: LatLngPoint[], progress01: number): LatLngPoint {
  if (path.length === 0) return { lat: 18.535, lng: 73.805 };
  if (path.length === 1 || progress01 <= 0) return path[0];
  if (progress01 >= 1) return path[path.length - 1];

  const totalSegments = path.length - 1;
  const scaled = progress01 * totalSegments;
  const idx = Math.min(totalSegments - 1, Math.floor(scaled));
  const frac = scaled - idx;
  const a = path[idx];
  const b = path[idx + 1];
  return {
    lat: a.lat + (b.lat - a.lat) * frac,
    lng: a.lng + (b.lng - a.lng) * frac,
  };
}

function slicePathAtProgress(
  path: LatLngPoint[],
  progress01: number
): { traveled: [number, number][]; remaining: [number, number][]; current: [number, number] } {
  if (path.length < 2) {
    const pt = path[0] || { lat: 18.535, lng: 73.805 };
    return {
      traveled: [[pt.lat, pt.lng]],
      remaining: [[pt.lat, pt.lng]],
      current: [pt.lat, pt.lng],
    };
  }
  if (progress01 <= 0) {
    return {
      traveled: [[path[0].lat, path[0].lng]],
      remaining: path.map((p) => [p.lat, p.lng]),
      current: [path[0].lat, path[0].lng],
    };
  }
  if (progress01 >= 1) {
    const end = path[path.length - 1];
    return {
      traveled: path.map((p) => [p.lat, p.lng]),
      remaining: [],
      current: [end.lat, end.lng],
    };
  }

  const totalSegments = path.length - 1;
  const scaled = progress01 * totalSegments;
  const idx = Math.min(totalSegments - 1, Math.floor(scaled));
  const currentPt = interpolateAlongPath(path, progress01);
  const current: [number, number] = [currentPt.lat, currentPt.lng];

  return {
    traveled: [...path.slice(0, idx + 1).map((p): [number, number] => [p.lat, p.lng]), current],
    remaining: [current, ...path.slice(idx + 1).map((p): [number, number] => [p.lat, p.lng])],
    current,
  };
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  routePolyline,
  traveledPolyline,
  origin,
  destination,
  transitProgressPct,
  isDelivered = false,
  isArrived = false,
  className = 'h-64 w-full rounded-2xl overflow-hidden',
  autoFitBounds = false,
  followTruck = false,
  showMapControls = false,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markerInstancesRef = useRef<Record<string, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const routeBgRef = useRef<L.Polyline | null>(null);
  const traveledRef = useRef<L.Polyline | null>(null);
  const initialFitDoneRef = useRef(false);
  const osrmCacheRef = useRef<Record<string, LatLngPoint[]>>({});

  const [tilesFailed, setTilesFailed] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [roadPath, setRoadPath] = useState<LatLngPoint[] | null>(null);

  // Fetch public OSRM road route when origin & destination are provided
  useEffect(() => {
    if (!origin || !destination) return;
    const key = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
    if (osrmCacheRef.current[key]) {
      setRoadPath(osrmCacheRef.current[key]);
      return;
    }

    let cancelled = false;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const coords: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
        if (coords && coords.length > 1) {
          const pts = coords.map(([lng, lat]) => ({ lat, lng }));
          osrmCacheRef.current[key] = pts;
          setRoadPath(pts);
        }
      })
      .catch(() => {
        // Fallback smoothly to passed polyline props
      });

    return () => {
      cancelled = true;
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  const computedSegments = useMemo(() => {
    if (roadPath && roadPath.length > 1 && transitProgressPct !== undefined) {
      const progress01 = isDelivered
        ? 1
        : isArrived
        ? 1
        : Math.max(0, Math.min(1, transitProgressPct / 100));
      return slicePathAtProgress(roadPath, progress01);
    }

    const truckMarker = markers.find((m) => m.type === 'truck');
    return {
      traveled: traveledPolyline || [],
      remaining: routePolyline || [],
      current: truckMarker ? ([truckMarker.lat, truckMarker.lng] as [number, number]) : undefined,
    };
  }, [roadPath, transitProgressPct, isDelivered, isArrived, traveledPolyline, routePolyline, markers]);

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
        baseTileLayerRef.current = null;
        markersGroupRef.current = null;
        markerInstancesRef.current = {};
      };
    }
  }, []);

  // Swap street / satellite tiles and fall back from CartoDB -> OpenStreetMap seamlessly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      baseTileLayerRef.current.remove();
      baseTileLayerRef.current = null;
    }

    if (mapTypeId === 'hybrid') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      satLayer.addTo(map);
      baseTileLayerRef.current = satLayer;
      setTilesFailed(false);
      return;
    }

    let switchedToOsm = false;
    let tileErrorCount = 0;

    const voyagerLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    );

    voyagerLayer.on('tileerror', () => {
      tileErrorCount += 1;
      if (tileErrorCount >= 3 && !switchedToOsm && mapInstanceRef.current) {
        switchedToOsm = true;
        voyagerLayer.remove();
        const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        });
        let osmErrors = 0;
        osmLayer.on('tileerror', () => {
          osmErrors += 1;
          if (osmErrors >= 4) setTilesFailed(true);
        });
        osmLayer.on('tileload', () => setTilesFailed(false));
        osmLayer.addTo(mapInstanceRef.current);
        baseTileLayerRef.current = osmLayer;
      }
    });

    voyagerLayer.on('tileload', () => setTilesFailed(false));
    voyagerLayer.addTo(map);
    baseTileLayerRef.current = voyagerLayer;
  }, [mapTypeId]);

  // Update center when changed and followTruck is enabled
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const targetCenter = computedSegments.current || center;
    if (followTruck) {
      mapInstanceRef.current.panTo(targetCenter, { animate: true, duration: 0.7 });
    }
  }, [center[0], center[1], computedSegments.current?.[0], computedSegments.current?.[1], followTruck]);

  // Smoothly update markers in-place without flickering
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const currentIds = new Set(markers.map((m) => m.id));

    Object.keys(markerInstancesRef.current).forEach((existingId) => {
      if (!currentIds.has(existingId)) {
        markerInstancesRef.current[existingId].remove();
        delete markerInstancesRef.current[existingId];
      }
    });

    markers.forEach((m) => {
      const markerPos: [number, number] =
        m.type === 'truck' && computedSegments.current
          ? computedSegments.current
          : [m.lat, m.lng];

      let iconHtml = `
        <div style="background-color: #0EA5C6; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 14px;">
          💧
        </div>
      `;

      if (m.type === 'truck') {
        const etaText = isDelivered
          ? 'Delivered ✓'
          : m.etaMin !== undefined
          ? m.etaMin > 0
            ? `ETA ${m.etaMin}m`
            : 'Arrived'
          : '';
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
            ${
              etaText
                ? `<div style="background-color: ${isDelivered || m.etaMin === 0 ? '#047857' : '#0A2540'}; color: ${isDelivered || m.etaMin === 0 ? '#FFFFFF' : '#38BDF8'}; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; margin-bottom: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; border: 1px solid ${isDelivered || m.etaMin === 0 ? '#34D399' : '#0284C7'};">${etaText}</div>`
                : ''
            }
            <div style="position: relative; width: 42px; height: 42px; background: linear-gradient(135deg, #0284C7, #0F766E); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(2, 132, 199, 0.45); border: 3px solid white;">
              <span style="font-size: 20px; transform: scaleX(-1);">🚚</span>
              <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background-color: #22C55E; border: 2px solid white; border-radius: 50%;"></div>
            </div>
            ${
              m.subLabel
                ? `<div style="background: white; color: #0F172A; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: 2px; border: 1px solid #E2E8F0; white-space: nowrap;">${m.subLabel}</div>`
                : ''
            }
          </div>
        `;
      } else if (m.type === 'source') {
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #047857; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(4, 120, 87, 0.35); border: 2.5px solid white;">
              <span style="font-size: 16px;">⛲</span>
            </div>
            <div style="background: white; color: #065F46; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: 2px; border: 1px solid #A7F3D0; white-space: nowrap;">PMC Source</div>
          </div>
        `;
      } else if (m.type === 'delivery') {
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #E11D48; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.35); border: 2.5px solid white;">
              <span style="font-size: 17px;">📍</span>
            </div>
            <div style="background: white; color: #9F1239; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: 2px; border: 1px solid #FECDD3; white-space: nowrap;">Delivery</div>
          </div>
        `;
      } else if (m.type === 'hub') {
        iconHtml = `
          <div style="background-color: #8B5CF6; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(139,92,246,0.4); border: 2px solid white;">
            🚰
          </div>
        `;
      } else if (m.type === 'report') {
        iconHtml = `
          <div style="background-color: #06B6D4; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2); border: 2px solid white;">
            🌊
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-map-icon',
        html: iconHtml,
        iconSize: [54, 62],
        iconAnchor: [27, 31],
      });

      const existingMarker = markerInstancesRef.current[m.id];
      if (existingMarker) {
        existingMarker.setLatLng(markerPos);
        existingMarker.setIcon(customIcon);
        if (m.popupContent || m.title) {
          existingMarker.setPopupContent(`
            <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; padding: 2px;">
              <div style="font-weight: 800; color: #0A2540; font-size: 13px;">${m.title}</div>
              ${m.popupContent ? `<div style="color: #475569; margin-top: 4px; font-size: 11px;">${m.popupContent}</div>` : ''}
            </div>
          `);
        }
      } else {
        const marker = L.marker(markerPos, {
          icon: customIcon,
          zIndexOffset: m.type === 'truck' ? 500 : 100,
        });
        if (m.popupContent || m.title) {
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; padding: 2px;">
              <div style="font-weight: 800; color: #0A2540; font-size: 13px;">${m.title}</div>
              ${m.popupContent ? `<div style="color: #475569; margin-top: 4px; font-size: 11px;">${m.popupContent}</div>` : ''}
            </div>
          `);
        }
        marker.addTo(markersGroupRef.current!);
        markerInstancesRef.current[m.id] = marker;
      }
    });

    if (autoFitBounds && markers.length > 1 && !initialFitDoneRef.current) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
      initialFitDoneRef.current = true;
    }
  }, [markers, autoFitBounds, computedSegments.current, isDelivered]);

  // Update route polylines
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeBgRef.current) {
      routeBgRef.current.remove();
      routeBgRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (traveledRef.current) {
      traveledRef.current.remove();
      traveledRef.current = null;
    }

    if (computedSegments.remaining.length > 1) {
      routeBgRef.current = L.polyline(computedSegments.remaining, {
        color: '#0C4A6E',
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);

      polylineRef.current = L.polyline(computedSegments.remaining, {
        color: '#1A73E8',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);
    }

    if (computedSegments.traveled.length > 1) {
      traveledRef.current = L.polyline(computedSegments.traveled, {
        color: '#0D9488',
        weight: 5.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);
    }
  }, [computedSegments]);

  const handleFitCorridor = () => {
    if (!mapInstanceRef.current || markers.length === 0) return;
    const pts: [number, number][] = [
      ...markers.map((m): [number, number] => [m.lat, m.lng]),
      ...(roadPath ? roadPath.map((p): [number, number] => [p.lat, p.lng]) : []),
    ];
    if (pts.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(pts), {
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#E5F1F6] ${className}`}>
      {tilesFailed && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(14,116,144,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,116,144,0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      )}

      <div
        ref={mapContainerRef}
        className="w-full h-full relative z-0"
        style={{ minHeight: '100%' }}
      />

      {showMapControls && (
        <div className="absolute top-3 left-3 z-[500] flex flex-wrap items-center gap-1.5">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-0.5 shadow-md border border-slate-200 flex items-center text-[11px] font-bold">
            <button
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                mapTypeId === 'roadmap'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers size={12} />
              <span>Map</span>
            </button>
            <button
              onClick={() => setMapTypeId('hybrid')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                mapTypeId === 'hybrid'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            onClick={handleFitCorridor}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md bg-white/95 hover:bg-white text-slate-700 backdrop-blur-md border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            title="Fit entire delivery route"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">Fit Route</span>
          </button>
        </div>
      )}
    </div>
  );
};
