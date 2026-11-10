'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Pilot Zone Polygons for visual reference on map
const PILOT_ZONES = [
  {
    code: 'IND-1',
    name: 'Industrial Use Zone (SIDCO Pilot)',
    color: '#818cf8', // indigo
    coords: [
      [10.95, 76.90],
      [10.95, 77.05],
      [11.08, 77.05],
      [11.08, 76.90],
    ],
  },
  {
    code: 'COM-1',
    name: 'Commercial Use Zone (Central)',
    color: '#fbbf24', // amber
    coords: [
      [10.95, 77.05],
      [10.95, 77.15],
      [11.08, 77.15],
      [11.08, 77.05],
    ],
  },
];

export default function LeafletMap({
  plot,
  onPlotChange,
  frontEdgeIndex,
  onFrontEdgeChange,
  buildableFootprint,
  isDrawing,
  setIsDrawing,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    zones: null,
    plot: null,
    frontEdge: null,
    buildable: null,
    vertexMarkers: [],
    drawMarkers: [],
  });

  const [drawPoints, setDrawPoints] = useState([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.0003, 76.9602],
      zoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Clean CartoDB Positron tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Render Pilot Zones as background references
    const zonesGroup = L.layerGroup().addTo(map);
    PILOT_ZONES.forEach(z => {
      const poly = L.polygon(z.coords, {
        color: z.color,
        weight: 1.5,
        fillColor: z.color,
        fillOpacity: 0.08,
        dashArray: '4, 4',
      }).addTo(zonesGroup);

      poly.bindTooltip(`${z.code}: ${z.name}`, { sticky: true, className: 'custom-leaflet-tooltip' });
    });
    layersRef.current.zones = zonesGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click when in drawing mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    function handleMapClick(e) {
      if (!isDrawing) return;
      const { lat, lng } = e.latlng;
      setDrawPoints(prev => [...prev, [lng, lat]]);
    }

    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [isDrawing]);

  // Update drawing temp markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old draw markers
    layersRef.current.drawMarkers.forEach(m => m.remove());
    layersRef.current.drawMarkers = [];

    if (isDrawing && drawPoints.length > 0) {
      // Draw lines between clicked points
      const latlngs = drawPoints.map(([lng, lat]) => [lat, lng]);
      const tempLine = L.polyline(latlngs, { color: '#f97316', weight: 2, dashArray: '3, 5' }).addTo(map);
      layersRef.current.drawMarkers.push(tempLine);

      // Draw point markers
      drawPoints.forEach(([lng, lat], idx) => {
        const marker = L.circleMarker([lat, lng], {
          radius: idx === 0 ? 7 : 5,
          color: idx === 0 ? '#16a34a' : '#ea580c',
          fillColor: idx === 0 ? '#22c55e' : '#f97316',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map);

        marker.bindTooltip(idx === 0 ? 'Click to close polygon' : `Vertex ${idx + 1}`, {
          permanent: false,
          className: 'custom-leaflet-tooltip',
        });

        if (idx === 0 && drawPoints.length >= 3) {
          marker.on('click', () => {
            // Close polygon and finish drawing
            const closedCoordinates = [...drawPoints, drawPoints[0]];
            onPlotChange({
              type: 'Polygon',
              coordinates: [closedCoordinates],
            });
            setDrawPoints([]);
            setIsDrawing(false);
          });
        }

        layersRef.current.drawMarkers.push(marker);
      });
    }
  }, [drawPoints, isDrawing, onPlotChange, setIsDrawing]);

  // Render Plot Polygon, Vertices & Buildable Footprint
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up existing plot layers
    if (layersRef.current.plot) layersRef.current.plot.remove();
    if (layersRef.current.frontEdge) layersRef.current.frontEdge.remove();
    if (layersRef.current.buildable) layersRef.current.buildable.remove();
    layersRef.current.vertexMarkers.forEach(m => m.remove());
    layersRef.current.vertexMarkers = [];

    if (!plot || !plot.coordinates || !plot.coordinates[0] || plot.coordinates[0].length < 4) {
      return;
    }

    const ring = plot.coordinates[0];
    const latlngs = ring.map(([lng, lat]) => [lat, lng]);

    // 1. Plot Polygon Layer
    const plotPoly = L.polygon(latlngs, {
      color: '#2563eb', // blue
      weight: 2.5,
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
    }).addTo(map);

    plotPoly.bindTooltip('Subject Plot Boundary', { sticky: true, className: 'custom-leaflet-tooltip' });
    layersRef.current.plot = plotPoly;

    // 2. Vertex markers with edge selection
    const N = ring.length - 1;
    for (let i = 0; i < N; i++) {
      const [lng, lat] = ring[i];
      const nextCoord = ring[i + 1];

      // Clickable Edge line segment to set frontEdge
      const edgeLine = L.polyline([[lat, lng], [nextCoord[1], nextCoord[0]]], {
        weight: i === frontEdgeIndex ? 5 : 4,
        color: i === frontEdgeIndex ? '#ea580c' : '#93c5fd',
        opacity: i === frontEdgeIndex ? 1 : 0.4,
      }).addTo(map);

      edgeLine.bindTooltip(`Edge #${i} ${i === frontEdgeIndex ? '(Frontage Road)' : '- Click to set as Front'}`, {
        sticky: true,
        className: 'custom-leaflet-tooltip',
      });

      edgeLine.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onFrontEdgeChange) onFrontEdgeChange(i);
      });

      layersRef.current.vertexMarkers.push(edgeLine);

      // Vertex circle marker
      const vertexMarker = L.circleMarker([lat, lng], {
        radius: 4.5,
        color: '#1d4ed8',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      vertexMarker.bindTooltip(`P${i + 1}`, { className: 'custom-leaflet-tooltip' });
      layersRef.current.vertexMarkers.push(vertexMarker);
    }

    // 3. Highlighted Front Edge
    if (typeof frontEdgeIndex === 'number' && frontEdgeIndex >= 0 && frontEdgeIndex < N) {
      const p1 = ring[frontEdgeIndex];
      const p2 = ring[frontEdgeIndex + 1];
      const frontLine = L.polyline([[p1[1], p1[0]], [p2[1], p2[0]]], {
        color: '#ea580c', // orange-red
        weight: 6,
        opacity: 0.95,
      }).addTo(map);

      frontLine.bindTooltip(`Frontage Edge #${frontEdgeIndex} (Road Access)`, {
        permanent: true,
        direction: 'center',
        className: 'custom-leaflet-tooltip',
      });

      layersRef.current.frontEdge = frontLine;
    }

    // 4. Buildable Footprint Layer (if present in results)
    if (buildableFootprint && buildableFootprint.coordinates && buildableFootprint.coordinates[0]) {
      const bRing = buildableFootprint.coordinates[0];
      const bLatlngs = bRing.map(([lng, lat]) => [lat, lng]);

      const buildablePoly = L.polygon(bLatlngs, {
        color: '#16a34a', // green
        weight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.45,
      }).addTo(map);

      buildablePoly.bindTooltip('Permissible Buildable Footprint (Post-Setbacks)', {
        sticky: true,
        className: 'custom-leaflet-tooltip',
      });

      layersRef.current.buildable = buildablePoly;
    }

    // Fit map bounds to plot
    map.fitBounds(plotPoly.getBounds(), { padding: [50, 50], maxZoom: 18 });
  }, [plot, frontEdgeIndex, buildableFootprint, onFrontEdgeChange]);

  const cancelDrawing = () => {
    setDrawPoints([]);
    setIsDrawing(false);
  };

  const completeDrawing = () => {
    if (drawPoints.length < 3) return;
    const closed = [...drawPoints, drawPoints[0]];
    onPlotChange({
      type: 'Polygon',
      coordinates: [closed],
    });
    setDrawPoints([]);
    setIsDrawing(false);
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200" />

      {/* Floating Drawing Control Overlay */}
      {isDrawing && (
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 text-white backdrop-blur-md px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-medium">
              {drawPoints.length === 0
                ? 'Click on the map to place vertices'
                : `${drawPoints.length} points placed. Click 1st point or "Finish" to close polygon.`}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {drawPoints.length >= 3 && (
              <button
                onClick={completeDrawing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all"
              >
                Finish Polygon
              </button>
            )}
            <button
              onClick={cancelDrawing}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-lg shadow-md border border-slate-200 text-xs flex flex-col gap-1.5">
        <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Map Legend</span>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-2.5 border-2 border-blue-600 bg-blue-100 rounded-sm" />
          <span className="text-slate-600">Plot Boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-orange-600 rounded-sm" />
          <span className="text-slate-600">Front Road Access Edge</span>
        </div>
        {buildableFootprint && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2.5 border border-emerald-600 bg-emerald-400/50 rounded-sm" />
            <span className="text-slate-600 font-medium">Buildable Footprint</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-2.5 border border-indigo-400 border-dashed bg-indigo-50/50 rounded-sm" />
          <span className="text-slate-500">IND-1 Industrial Zone</span>
        </div>
      </div>
    </div>
  );
}

