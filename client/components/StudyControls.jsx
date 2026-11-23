'use client';

import React, { useRef } from 'react';
import { PenTool, Layers, Compass, Play, Sparkles, Upload, AlertCircle } from 'lucide-react';

const PRESET_PLOTS = [
  {
    name: 'Standard 40x50m Industrial Plot (2,000 m²)',
    area: '2,000 m²',
    intendedUse: 'warehouse',
    frontEdgeIndex: 0,
    coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005], [76.96, 11.0005], [76.96, 11.0]]],
  },
  {
    name: 'Deep 30x60m Logistics Plot (1,800 m²)',
    area: '1,800 m²',
    intendedUse: 'warehouse',
    frontEdgeIndex: 1,
    coordinates: [[[76.961, 11.001], [76.9613, 11.001], [76.9613, 11.0016], [76.961, 11.0016], [76.961, 11.001]]],
  },
  {
    name: 'Major 100x100m Distribution Center (10,000 m²)',
    area: '10,000 m²',
    intendedUse: 'light_industry',
    frontEdgeIndex: 0,
    coordinates: [[[76.965, 11.005], [76.966, 11.005], [76.966, 11.006], [76.965, 11.006], [76.965, 11.005]]],
  },
  {
    name: 'Constrained 10x20m Plot (200 m² — Sub-scale)',
    area: '200 m²',
    intendedUse: 'warehouse',
    frontEdgeIndex: 0,
    coordinates: [[[76.962, 11.002], [76.9621, 11.002], [76.9621, 11.0022], [76.962, 11.0022], [76.962, 11.002]]],
  },
];

const INTENDED_USES = [
  { value: 'warehouse', label: 'Warehouse / Logistics Hub', tag: 'Permitted in IND-1' },
  { value: 'light_industry', label: 'Light Industry / Assembly', tag: 'Permitted in IND-1' },
  { value: 'cold_storage', label: 'Cold Storage Facility', tag: 'Conditional in IND-1' },
  { value: 'residential', label: 'Residential Housing', tag: 'Prohibited in IND-1' },
  { value: 'hazardous_chemicals', label: 'Chemical Refining', tag: 'Prohibited in IND-1' },
];

export default function StudyControls({
  plot,
  onPlotChange,
  intendedUse,
  onIntendedUseChange,
  frontEdgeIndex,
  onFrontEdgeChange,
  onRunStudy,
  loading,
  isDrawing,
  setIsDrawing,
}) {
  const edgeCount = plot?.coordinates?.[0]?.length ? plot.coordinates[0].length - 1 : 0;
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = React.useState(null);

  const handlePresetSelect = (e) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx) || idx < 0) return;
    const p = PRESET_PLOTS[idx];
    onPlotChange({
      type: 'Polygon',
      coordinates: p.coordinates,
    });
    onIntendedUseChange(p.intendedUse);
    onFrontEdgeChange(p.frontEdgeIndex);
  };

  /**
   * Extract the first Polygon ring from any GeoJSON shape:
   *   - Polygon → use directly
   *   - Feature<Polygon> → unwrap geometry
   *   - FeatureCollection → take the first Polygon feature
   *   - GeometryCollection → take the first Polygon geometry
   */
  function extractPolygon(geojson) {
    if (!geojson || typeof geojson !== 'object') return null;
    const { type } = geojson;
    if (type === 'Polygon') return geojson;
    if (type === 'Feature') {
      if (geojson.geometry?.type === 'Polygon') return geojson.geometry;
      if (geojson.geometry?.type === 'MultiPolygon') {
        // Use the first polygon of the MultiPolygon
        return { type: 'Polygon', coordinates: geojson.geometry.coordinates[0] };
      }
    }
    if (type === 'FeatureCollection') {
      for (const feat of geojson.features || []) {
        const poly = extractPolygon(feat);
        if (poly) return poly;
      }
    }
    if (type === 'GeometryCollection') {
      for (const geom of geojson.geometries || []) {
        const poly = extractPolygon({ type: geom.type, coordinates: geom.coordinates });
        if (poly) return poly;
      }
    }
    if (type === 'MultiPolygon') {
      return { type: 'Polygon', coordinates: geojson.coordinates[0] };
    }
    return null;
  }

  const handleGeoJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = ''; // reset so the same file can be re-uploaded
    if (!file) return;
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const polygon = extractPolygon(json);
        if (!polygon) {
          setUploadError('No Polygon geometry found in this GeoJSON file.');
          return;
        }
        // Ensure ring is closed
        const ring = polygon.coordinates[0];
        if (!ring || ring.length < 4) {
          setUploadError('Polygon ring must have at least 3 distinct vertices.');
          return;
        }
        const first = ring[0];
        const last = ring[ring.length - 1];
        const closedRing =
          first[0] === last[0] && first[1] === last[1]
            ? ring
            : [...ring, first];
        onPlotChange({ type: 'Polygon', coordinates: [closedRing] });
        onFrontEdgeChange(0); // reset front edge to first edge
      } catch {
        setUploadError('Invalid JSON — could not parse GeoJSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-5 transition-colors">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Study Configuration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Define your parcel boundaries and intended statutory land use.
        </p>
      </div>

      {/* Preset Plot Quick Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Preset Plots</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Quick Load</span>
        </label>
        <select
          onChange={handlePresetSelect}
          defaultValue=""
          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
        >
          <option value="" disabled className="dark:bg-slate-900">Select a verified test parcel...</option>
          {PRESET_PLOTS.map((p, i) => (
            <option key={i} value={i} className="dark:bg-slate-900">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Draw or Custom Boundary */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setIsDrawing(prev => !prev)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${isDrawing
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          {isDrawing ? 'Click map to draw...' : 'Draw Custom Plot on Map'}
        </button>

        {/* GeoJSON file upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          className="hidden"
          onChange={handleGeoJsonFile}
        />
        <button
          type="button"
          onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
          title="Upload a .geojson file"
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          GeoJSON
        </button>
      </div>

      {/* GeoJSON upload error */}
      {uploadError && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs px-3 py-2.5 rounded-lg animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* Intended Land Use */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Intended Land Use</label>
        <select
          value={intendedUse}
          onChange={(e) => onIntendedUseChange(e.target.value)}
          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
        >
          {INTENDED_USES.map((u) => (
            <option key={u.value} value={u.value} className="dark:bg-slate-900">
              {u.label} — {u.tag}
            </option>
          ))}
        </select>
      </div>

      {/* Frontage Edge Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            Front Road Access Edge
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">TNCDBR Rule 36</span>
        </label>
        <select
          value={frontEdgeIndex !== null ? frontEdgeIndex : ''}
          onChange={(e) => onFrontEdgeChange(e.target.value === '' ? null : parseInt(e.target.value))}
          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
        >
          {edgeCount > 0 ? (
            Array.from({ length: edgeCount }).map((_, idx) => (
              <option key={idx} value={idx} className="dark:bg-slate-900">
                Edge #{idx} {idx === frontEdgeIndex ? '(Current Frontage)' : ''}
              </option>
            ))
          ) : (
            <option value="" className="dark:bg-slate-900">Draw or select a plot first</option>
          )}
          <option value="" className="dark:bg-slate-900">Uniform Inward Buffer (Fallback)</option>
        </select>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Tip: You can also click directly on any edge on the map to set the road frontage.
        </p>
      </div>

      {/* Submit Run Study Button */}
      <button
        onClick={onRunStudy}
        disabled={loading || !plot}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.99]"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Evaluating Zoning Bylaws...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Run Feasibility Assessment</span>
          </>
        )}
      </button>
    </div>
  );
}

