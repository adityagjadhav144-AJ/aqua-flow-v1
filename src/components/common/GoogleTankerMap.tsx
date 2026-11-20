/// <reference types="google.maps" />
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { Navigation, Layers, Activity, Maximize2 } from 'lucide-react';

export interface GoogleMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type?: 'truck' | 'source' | 'delivery' | 'hub' | 'report';
  popupContent?: string;
  etaMin?: number;
  subLabel?: string;
}

interface GoogleTankerMapProps {
  center: [number, number];
  zoom?: number;
  markers?: GoogleMapMarker[];
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
): { traveled: LatLngPoint[]; remaining: LatLngPoint[]; current: LatLngPoint } {
  if (path.length < 2) {
    const pt = path[0] || { lat: 18.535, lng: 73.805 };
    return { traveled: [pt], remaining: [pt], current: pt };
  }
  if (progress01 <= 0) {
    return { traveled: [path[0]], remaining: path, current: path[0] };
  }
  if (progress01 >= 1) {
    const end = path[path.length - 1];
    return { traveled: path, remaining: [], current: end };
  }

  const totalSegments = path.length - 1;
  const scaled = progress01 * totalSegments;
  const idx = Math.min(totalSegments - 1, Math.floor(scaled));
  const current = interpolateAlongPath(path, progress01);

  return {
    traveled: [...path.slice(0, idx + 1), current],
    remaining: [current, ...path.slice(idx + 1)],
    current,
  };
}

const MarkerWithInfoWindow: React.FC<{
  markerData: GoogleMapMarker;
  overridePosition?: LatLngPoint;
  isDelivered?: boolean;
}> = ({ markerData, overridePosition, isDelivered }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  const pos = overridePosition || { lat: markerData.lat, lng: markerData.lng };

  const renderBadge = () => {
    if (markerData.type === 'truck') {
      const etaLabel = isDelivered
        ? 'Delivered ✓'
        : markerData.etaMin !== undefined
        ? markerData.etaMin <= 0
          ? 'Arrived'
          : `ETA ${markerData.etaMin}m`
        : '';

      return (
        <div className="flex flex-col items-center cursor-pointer select-none -translate-y-1">
          {etaLabel && (
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border whitespace-nowrap mb-1 ${
                isDelivered || markerData.etaMin === 0
                  ? 'bg-emerald-700 text-white border-emerald-400'
                  : 'bg-[#0A2540] text-sky-300 border-sky-500/60'
              }`}
            >
              {etaLabel}
            </div>
          )}
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-sky-600 to-teal-700 text-white flex items-center justify-center border-[3px] border-white shadow-xl">
            <span className="text-lg leading-none" style={{ transform: 'scaleX(-1)' }}>
              🚚
            </span>
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isDelivered ? 'bg-emerald-400' : 'bg-emerald-400 animate-ping'
              }`}
            />
          </div>
          {markerData.subLabel && (
            <div className="mt-0.5 bg-white text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow border border-slate-200 whitespace-nowrap">
              {markerData.subLabel}
            </div>
          )}
        </div>
      );
    }

    if (markerData.type === 'source') {
      return (
        <div className="flex flex-col items-center cursor-pointer select-none">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center border-2 border-white shadow-lg">
            <span className="text-sm leading-none">⛲</span>
          </div>
          <div className="mt-0.5 bg-white text-emerald-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow border border-emerald-200 whitespace-nowrap">
            PMC Source
          </div>
        </div>
      );
    }

    if (markerData.type === 'delivery') {
      return (
        <div className="flex flex-col items-center cursor-pointer select-none">
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center border-2 border-white shadow-lg">
            <span className="text-sm leading-none">📍</span>
          </div>
          <div className="mt-0.5 bg-white text-rose-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow border border-rose-200 whitespace-nowrap">
            Delivery
          </div>
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center border-2 border-white shadow-md cursor-pointer">
        <span className="text-sm leading-none">💧</span>
      </div>
    );
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={pos}
        title={markerData.title}
        zIndex={markerData.type === 'truck' ? 500 : 100}
        onClick={() => setInfoOpen((prev) => !prev)}
      >
        {renderBadge()}
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={240} onCloseClick={() => setInfoOpen(false)}>
          <div className="p-1 text-slate-800 space-y-1">
            <div className="font-extrabold text-xs text-slate-900">{markerData.title}</div>
            {markerData.popupContent && (
              <div className="text-[11px] text-slate-600 leading-snug">{markerData.popupContent}</div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapOverlaysAndRouting: React.FC<{
  origin?: LatLngPoint;
  destination?: LatLngPoint;
  markers: GoogleMapMarker[];
  routePolyline?: [number, number][];
  traveledPolyline?: [number, number][];
  transitProgressPct?: number;
  isDelivered?: boolean;
  isArrived?: boolean;
  followTruck?: boolean;
  autoFitBounds?: boolean;
  showTraffic: boolean;
  fitTrigger: number;
}> = ({
  origin,
  destination,
  markers,
  routePolyline,
  traveledPolyline,
  transitProgressPct,
  isDelivered,
  isArrived,
  followTruck,
  autoFitBounds,
  showTraffic,
  fitTrigger,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const mapsLib = useMapsLibrary('maps');

  // Cache road polylines per "lat,lng->lat,lng" pair (avoiding Map identifier collision)
  const routeCacheRef = useRef<Record<string, LatLngPoint[]>>({});
  const [roadPath, setRoadPath] = useState<LatLngPoint[] | null>(null);
  const traveledPolyRef = useRef<google.maps.Polyline | null>(null);
  const remainingCasingRef = useRef<google.maps.Polyline | null>(null);
  const remainingPolyRef = useRef<google.maps.Polyline | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const initialFitDoneRef = useRef(false);

  // Compute real driving route once per origin-destination via modern Routes SDK
  useEffect(() => {
    if (!routesLib || !origin || !destination) return;

    const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
    if (routeCacheRef.current[cacheKey]) {
      setRoadPath(routeCacheRef.current[cacheKey]);
      return;
    }

    let cancelled = false;
    const request: google.maps.routes.ComputeRoutesRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    routesLib.Route.computeRoutes(request)
      .then((response) => {
        if (cancelled) return;
        const primaryRoute = response?.routes?.[0];
        if (primaryRoute?.path && primaryRoute.path.length > 1) {
          const pts = primaryRoute.path.map((pt) => ({
            lat: pt.lat,
            lng: pt.lng,
          }));
          routeCacheRef.current[cacheKey] = pts;
          setRoadPath(pts);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('429') ||
          msg.includes('OVER_QUERY_LIMIT')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routesLib, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  // Calculate active traveled / remaining road polylines & snapped truck coordinates
  const computedSegments = useMemo(() => {
    if (roadPath && roadPath.length > 1 && transitProgressPct !== undefined) {
      const progress01 = isDelivered ? 1 : isArrived ? 1 : Math.max(0, Math.min(1, transitProgressPct / 100));
      return slicePathAtProgress(roadPath, progress01);
    }

    const fallbackTraveled = (traveledPolyline || []).map(([lat, lng]) => ({ lat, lng }));
    const fallbackRemaining = (routePolyline || []).map(([lat, lng]) => ({ lat, lng }));
    const truckMarker = markers.find((m) => m.type === 'truck');
    return {
      traveled: fallbackTraveled,
      remaining: fallbackRemaining,
      current: truckMarker ? { lat: truckMarker.lat, lng: truckMarker.lng } : undefined,
    };
  }, [roadPath, transitProgressPct, isDelivered, isArrived, traveledPolyline, routePolyline, markers]);

  // Draw Google Maps Polylines for traveled & remaining routes
  useEffect(() => {
    if (!map || !mapsLib) return;

    if (traveledPolyRef.current) traveledPolyRef.current.setMap(null);
    if (remainingCasingRef.current) remainingCasingRef.current.setMap(null);
    if (remainingPolyRef.current) remainingPolyRef.current.setMap(null);

    if (computedSegments.remaining.length > 1) {
      remainingCasingRef.current = new mapsLib.Polyline({
        path: computedSegments.remaining,
        geodesic: true,
        strokeColor: '#0C4A6E',
        strokeOpacity: 0.35,
        strokeWeight: 8,
        zIndex: 10,
        map,
      });

      remainingPolyRef.current = new mapsLib.Polyline({
        path: computedSegments.remaining,
        geodesic: true,
        strokeColor: '#1A73E8',
        strokeOpacity: 0.92,
        strokeWeight: 5,
        zIndex: 15,
        map,
      });
    }

    if (computedSegments.traveled.length > 1) {
      traveledPolyRef.current = new mapsLib.Polyline({
        path: computedSegments.traveled,
        geodesic: true,
        strokeColor: '#0D9488',
        strokeOpacity: 0.95,
        strokeWeight: 5.5,
        zIndex: 20,
        map,
      });
    }

    return () => {
      traveledPolyRef.current?.setMap(null);
      remainingCasingRef.current?.setMap(null);
      remainingPolyRef.current?.setMap(null);
    };
  }, [map, mapsLib, computedSegments]);

  // Manage live TrafficLayer
  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new mapsLib.TrafficLayer();
    }
    trafficLayerRef.current.setMap(showTraffic ? map : null);

    return () => {
      trafficLayerRef.current?.setMap(null);
    };
  }, [map, mapsLib, showTraffic]);

  // Follow moving tanker smoothly
  useEffect(() => {
    if (!map || !followTruck || !computedSegments.current) return;
    map.panTo(computedSegments.current);
  }, [map, followTruck, computedSegments.current?.lat, computedSegments.current?.lng]);

  // Auto-fit full corridor on initial mount or user click
  useEffect(() => {
    if (!map) return;
    const shouldFit = (autoFitBounds && !initialFitDoneRef.current) || fitTrigger > 0;
    if (!shouldFit) return;

    const boundsPoints: LatLngPoint[] = [
      ...markers.map((m) => ({ lat: m.lat, lng: m.lng })),
      ...(roadPath || []),
    ];
    if (boundsPoints.length < 2) return;

    const bounds = new google.maps.LatLngBounds();
    boundsPoints.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 72, left: 48 });
    initialFitDoneRef.current = true;
  }, [map, autoFitBounds, fitTrigger, markers, roadPath]);

  return (
    <>
      {markers.map((m) => (
        <MarkerWithInfoWindow
          key={m.id}
          markerData={m}
          overridePosition={m.type === 'truck' ? computedSegments.current : undefined}
          isDelivered={m.type === 'truck' ? isDelivered : false}
        />
      ))}
    </>
  );
};

export const GoogleTankerMap: React.FC<GoogleTankerMapProps> = ({
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
  className = 'h-64 w-full',
  autoFitBounds = false,
  followTruck = false,
  showMapControls = false,
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const apiLoadingStatus = useApiLoadingStatus();
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [fitTrigger, setFitTrigger] = useState<number>(0);

  const defaultCenter = useMemo(
    () => ({ lat: center[0], lng: center[1] }),
    [center[0], center[1]]
  );

  const handleFitCorridor = useCallback(() => {
    setFitTrigger((n) => n + 1);
  }, []);

  if (
    !apiKey ||
    apiLoadingStatus === APILoadingStatus.AUTH_FAILURE ||
    apiLoadingStatus === APILoadingStatus.FAILED
  ) {
    const truck = markers.find((m) => m.type === 'truck');
    return (
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-slate-100 flex flex-col items-center justify-center p-4 text-center ${className}`}
      >
        <div
          className="absolute inset-0 opacity-45 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(2,132,199,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(2,132,199,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10 max-w-xs space-y-2 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-sky-200 shadow-sm">
          <Navigation className="w-7 h-7 text-cyan-600 mx-auto animate-pulse" />
          <div className="text-xs font-black text-slate-900">
            {truck ? truck.title : 'Live Tanker GPS Telemetry'}
          </div>
          <p className="text-[11px] text-slate-500">
            {truck
              ? `Live Coordinates: ${truck.lat.toFixed(4)}°N, ${truck.lng.toFixed(4)}°E`
              : 'Unable to load Google Maps tiles right now.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-[#E5F1F6] ${className}`}>
      <GoogleMap
        defaultCenter={defaultCenter}
        defaultZoom={zoom}
        mapId="DEMO_MAP_ID"
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        disableDefaultUI={!showMapControls}
        zoomControl={true}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        <MapOverlaysAndRouting
          origin={origin}
          destination={destination}
          markers={markers}
          routePolyline={routePolyline}
          traveledPolyline={traveledPolyline}
          transitProgressPct={transitProgressPct}
          isDelivered={isDelivered}
          isArrived={isArrived}
          followTruck={followTruck}
          autoFitBounds={autoFitBounds}
          showTraffic={showTraffic}
          fitTrigger={fitTrigger}
        />
      </GoogleMap>

      {/* Google Maps-style Layer & Traffic Switcher */}
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
            onClick={() => setShowTraffic((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md backdrop-blur-md border flex items-center gap-1 cursor-pointer transition-colors ${
              showTraffic
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
            }`}
            title="Toggle Google Maps live traffic"
          >
            <Activity size={12} />
            <span>Traffic</span>
          </button>

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
