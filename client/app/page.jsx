'use client';

import React, { useState } from 'react';
import MapView from '../components/MapView';
import StudyControls from '../components/StudyControls';
import ResultCard from '../components/ResultCard';
import { feasibilityApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AlertCircle, CheckCircle2, MapPinOff } from 'lucide-react';

// Default initial plot: Standard 40m x 50m industrial parcel in Coimbatore SIDCO
const INITIAL_PLOT = {
  type: 'Polygon',
  coordinates: [
    [
      [76.96, 11.0],
      [76.9604, 11.0],
      [76.9604, 11.0005],
      [76.96, 11.0005],
      [76.96, 11.0],
    ],
  ],
};

export default function FeasibilityStudioPage() {
  const { token, user } = useAuth();

  const [plot, setPlot] = useState(INITIAL_PLOT);
  const [intendedUse, setIntendedUse] = useState('warehouse');
  const [frontEdgeIndex, setFrontEdgeIndex] = useState(0);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleRunStudy = async () => {
    if (!plot) return;
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const payload = {
        plot,
        intendedUse,
        frontEdgeIndex: frontEdgeIndex !== null ? frontEdgeIndex : undefined,
      };

      const res = await feasibilityApi.evaluate(payload, token);
      setResult(res);

      if (res.reportId && token) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 6000);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete zoning feasibility calculation');
    } finally {
      setLoading(false);
    }
  };

  const currentPayload = {
    plot,
    intendedUse,
    frontEdgeIndex: frontEdgeIndex !== null ? frontEdgeIndex : undefined,
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
      {/* Left: Map View Canvas */}
      <div className="w-full lg:flex-1 relative bg-slate-100 dark:bg-slate-900 flex flex-col h-[45vh] min-h-[380px] lg:h-full lg:min-h-full transition-colors flex-shrink-0 lg:flex-shrink">
        <MapView
          plot={plot}
          onPlotChange={setPlot}
          frontEdgeIndex={frontEdgeIndex}
          onFrontEdgeChange={setFrontEdgeIndex}
          buildableFootprint={result?.buildableFootprint}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
        />
      </div>

      {/* Right: Controls & Results Sidebar */}
      <div className="w-full lg:w-[480px] xl:w-[500px] bg-slate-50 dark:bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 transition-colors flex-shrink-0">
        {/* Alerts / Notifications */}
        {savedSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Study completed and saved to your account! Available in Saved Reports.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result?.verdict === 'cannot_assess' && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
            <MapPinOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Plot is outside pilot coverage. Load a preset parcel or draw inside the Coimbatore industrial corridor.</span>
          </div>
        )}

        {/* Study Configuration Card */}
        <StudyControls
          plot={plot}
          onPlotChange={setPlot}
          intendedUse={intendedUse}
          onIntendedUseChange={setIntendedUse}
          frontEdgeIndex={frontEdgeIndex}
          onFrontEdgeChange={setFrontEdgeIndex}
          onRunStudy={handleRunStudy}
          loading={loading}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
        />

        {/* Feasibility Assessment Result Card */}
        <ResultCard result={result} requestPayload={currentPayload} />
      </div>
    </div>
  );
}

