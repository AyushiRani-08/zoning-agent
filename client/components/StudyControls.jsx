'use client';

import React from 'react';
import { PenTool, Layers, Compass, Play, Sparkles } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Study Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Define your parcel boundaries and intended statutory land use.
        </p>
      </div>

      {/* Preset Plot Quick Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>Preset Plots</span>
          <span className="text-[10px] text-blue-600 font-medium">Quick Load</span>
        </label>
        <select
          onChange={handlePresetSelect}
          defaultValue=""
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        >
          <option value="" disabled>Select a verified test parcel...</option>
          {PRESET_PLOTS.map((p, i) => (
            <option key={i} value={i}>
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
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
            isDrawing
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          {isDrawing ? 'Click map to draw...' : 'Draw Custom Plot on Map'}
        </button>
      </div>

      <div className="border-t border-slate-100" />

      {/* Intended Land Use */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700">Intended Land Use</label>
        <select
          value={intendedUse}
          onChange={(e) => onIntendedUseChange(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        >
          {INTENDED_USES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label} — {u.tag}
            </option>
          ))}
        </select>
      </div>

      {/* Frontage Edge Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-orange-600" />
            Front Road Access Edge
          </span>
          <span className="text-[10px] text-slate-400">TNCDBR Rule 36</span>
        </label>
        <select
          value={frontEdgeIndex !== null ? frontEdgeIndex : ''}
          onChange={(e) => onFrontEdgeChange(e.target.value === '' ? null : parseInt(e.target.value))}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        >
          {edgeCount > 0 ? (
            Array.from({ length: edgeCount }).map((_, idx) => (
              <option key={idx} value={idx}>
                Edge #{idx} {idx === frontEdgeIndex ? '(Current Frontage)' : ''}
              </option>
            ))
          ) : (
            <option value="">Draw or select a plot first</option>
          )}
          <option value="">Uniform Inward Buffer (Fallback)</option>
        </select>
        <p className="text-[11px] text-slate-400">
          Tip: You can also click directly on any edge on the map to set the road frontage.
        </p>
      </div>

      {/* Submit Run Study Button */}
      <button
        onClick={onRunStudy}
        disabled={loading || !plot}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.99]"
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

