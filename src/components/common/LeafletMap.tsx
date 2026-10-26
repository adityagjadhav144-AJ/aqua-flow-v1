import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

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
  className?: string;
  autoFitBounds?: boolean;
  followTruck?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  routePolyline,
  className = 'h-64 w-full rounded-2xl overflow-hidden',
  autoFitBounds = false,
  followTruck = false,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const routeBgRef = useRef<L.Polyline | null>(null);
  const initialFitDoneRef = useRef(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      // Free OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Force recalculate dimensions in case container renders inside modal or tab
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Update center when changed and followTruck is enabled
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (followTruck) {
      mapInstanceRef.current.panTo(center, { animate: true, duration: 0.8 });
    }
  }, [center[0], center[1], followTruck]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    markers.forEach((m) => {
      let iconHtml = `
        <div style="background-color: #0EA5C6; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 14px;">
          💧
        </div>
      `;

      if (m.type === 'truck') {
        const etaText = m.etaMin !== undefined ? (m.etaMin > 0 ? `${m.etaMin}m` : 'Arrived') : '';
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            ${
              etaText
                ? `<div style="background-color: #0A2540; color: #38BDF8; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; margin-bottom: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; border: 1px solid #0284C7;">ETA ${etaText}</div>`
                : ''
            }
            <div style="position: relative; width: 42px; height: 42px; background: linear-gradient(135deg, #0284C7, #0F766E); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(2, 132, 199, 0.45); border: 3px solid white;">
              <span style="font-size: 20px; transform: scaleX(-1);">🚚</span>
              <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background-color: #22C55E; border: 2px solid white; border-radius: 50%;"></div>
            </div>
            ${
              m.subLabel
                ? `<div style="background: white; color: #0F172A; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: 2px; border: 1px solid #E2E8F0;">${m.subLabel}</div>`
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
            <div style="background: white; color: #065F46; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: 2px; border: 1px solid #A7F3D0;">PMC Source</div>
          </div>
        `;
      } else if (m.type === 'delivery') {
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #E11D48; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.35); border: 2.5px solid white;">
              <span style="font-size: 17px;">📍</span>
            </div>
            <div style="background: white; color: #9F1239; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: 2px; border: 1px solid #FECDD3;">Delivery</div>
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
        iconSize: [44, 52],
        iconAnchor: [22, 26],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });
      if (m.popupContent || m.title) {
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; padding: 2px;">
            <div style="font-weight: 800; color: #0A2540; font-size: 13px;">${m.title}</div>
            ${m.popupContent ? `<div style="color: #475569; margin-top: 4px; font-size: 11px;">${m.popupContent}</div>` : ''}
          </div>
        `);
      }
      marker.addTo(markersGroupRef.current!);
    });

    // Auto fit bounds if requested and markers exist
    if (autoFitBounds && markers.length > 1 && !initialFitDoneRef.current) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      initialFitDoneRef.current = true;
    }
  }, [markers, autoFitBounds]);

  // Update route polylines (casing + animated dashed line)
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

    if (routePolyline && routePolyline.length > 1) {
      // Background road casing
      routeBgRef.current = L.polyline(routePolyline, {
        color: '#0369A1',
        weight: 7,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);

      // Main active route path
      polylineRef.current = L.polyline(routePolyline, {
        color: '#0284C7',
        weight: 4,
        opacity: 0.95,
        dashArray: '10, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);
    }
  }, [routePolyline]);

  return <div ref={mapContainerRef} className={className} />;
};
