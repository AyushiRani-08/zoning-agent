'use client';

import React, { useState, useEffect } from 'react';
import VerdictBadge from './VerdictBadge';
import { Download, FileText, CheckCircle2, AlertCircle, Building2, Ruler, Sparkles, Lightbulb, BookOpen, ExternalLink, MapPinOff } from 'lucide-react';
import { feasibilityApi, reportsApi } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ResultCard({ result, requestPayload }) {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const [explanation, setExplanation] = useState(result?.explanation || null);
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState(null);

  useEffect(() => {
    setExplanation(result?.explanation || null);
    setExplainError(null);
  }, [result]);

  if (!result) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 transition-colors">
        <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">No Assessment Run Yet</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
          Select or draw a plot on the map and click &quot;Run Feasibility Assessment&quot; to see statutory parameters.
        </span>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      if (result.reportId && token) {
        // Download saved report from DB
        await reportsApi.downloadPdf(result.reportId, token);
      } else {
        // Direct on-the-fly download (include explanation if present)
        await feasibilityApi.downloadPdf({ ...requestPayload, explanation }, token);
      }
    } catch (err) {
      setDownloadError(err.message || 'Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  const handleGetExplanation = async () => {
    setExplaining(true);
    setExplainError(null);
    try {
      const res = await feasibilityApi.explain(requestPayload, token);
      setExplanation(res.explanation);
    } catch (err) {
      setExplainError(err.message || 'Failed to generate AI planning explanation');
    } finally {
      setExplaining(false);
    }
  };

  const isOutsideCoverage = result.verdict === 'cannot_assess';
  const plotArea = result.plotAreaSqM ? Math.round(result.plotAreaSqM).toLocaleString() : 'N/A';
  const buildableFootprint = result.buildableFootprintSqM !== undefined ? Math.round(result.buildableFootprintSqM).toLocaleString() : '0';
  const coveragePct = result.plotAreaSqM && result.buildableFootprintSqM
    ? Math.round((result.buildableFootprintSqM / result.plotAreaSqM) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-5 animate-fade-in transition-colors">
      {/* Header & Verdict */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Assessment Verdict
          </span>
          <div className="mt-1">
            <VerdictBadge verdict={result.verdict} className="text-sm px-3.5 py-1.5" />
          </div>
        </div>

        {/* 1-Click PDF Download */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloading || isOutsideCoverage}
          title={isOutsideCoverage ? 'PDF export is not available for unassessed plots' : 'Export vector PDF feasibility report'}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all"
        >
          {downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </>
          )}
        </button>
      </div>

      {downloadError && (
        <div className="text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 p-2.5 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Outside Coverage Alert Banner */}
      {isOutsideCoverage && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col gap-3 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
              <MapPinOff className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Plot Located Outside Pilot Coverage Area
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                The selected parcel boundaries lie outside the active pilot study jurisdiction (Tamil Nadu Industrial Pilot / Coimbatore SIDCO corridor). Statutory building parameters (FSI/FAR, setbacks, permitted land uses) cannot be evaluated for this parcel.
              </p>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-300 flex flex-col gap-1.5">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400">
              How to Test Feasibility
            </span>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Select one of the verified test parcels from the <strong>Preset Plots</strong> dropdown in Study Configuration, or upload a GeoJSON parcel located within Coimbatore, Tamil Nadu.
            </p>
          </div>
        </div>
      )}

      {/* Quantitative Summary Grid */}
      {!isOutsideCoverage && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Plot Survey Area</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{plotArea} m²</div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {result.plotAreaSqM ? `~${Math.round(result.plotAreaSqM * 10.7639).toLocaleString()} sq.ft` : ''}
            </span>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50 rounded-lg p-3">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Buildable Footprint</span>
            <div className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">{buildableFootprint} m²</div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{coveragePct}% ground coverage</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Max Floor Area (FAR)</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {result.maxFloorAreaSqM ? `${Math.round(result.maxFloorAreaSqM).toLocaleString()} m²` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">FSI 1.50 Multiplier</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Structure Height / Floors</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {result.estimatedFloors ? `${result.estimatedFloors} Floors` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Within 18.3m height cap</span>
          </div>
        </div>
      )}

      {/* Per-Edge Setbacks Breakdown */}
      {!isOutsideCoverage && Array.isArray(result.edgeBreakdown) && result.edgeBreakdown.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Setback Analysis by Boundary Edge
          </span>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-1.5 px-3">Edge</th>
                  <th className="py-1.5 px-3">Type</th>
                  <th className="py-1.5 px-3">Setback</th>
                  <th className="py-1.5 px-3 text-right">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.edgeBreakdown.map((e, idx) => (
                  <tr key={idx} className={e.type === 'front' ? 'bg-orange-50/40 dark:bg-orange-950/20 font-medium' : ''}>
                    <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">Edge #{e.edgeIndex}</td>
                    <td className="py-1.5 px-3">
                      <span className={`capitalize ${e.type === 'front' ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200">{e.setbackM}m</td>
                    <td className="py-1.5 px-3 text-right text-slate-500 dark:text-slate-400">
                      {typeof e.lengthM === 'number' ? `${Math.round(e.lengthM)}m` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statutory Findings Bullets */}
      <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Determinations & Legal Citations</span>
        <ul className="flex flex-col gap-1.5 mt-1">
          {result.reasons?.map((r, i) => (
            <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Planning Consultant Advisory Section */}
      {!isOutsideCoverage && (
        <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              AI Planning Consultant Insights
            </span>

            {!explanation && (
              <button
                onClick={handleGetExplanation}
                disabled={explaining}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all"
              >
                {explaining ? (
                  <>
                    <div className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>Consulting Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Ask Gemini</span>
                  </>
                )}
              </button>
            )}
          </div>

          {explainError && (
            <div className="text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
              {explainError}
            </div>
          )}

          {explanation && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-4 flex flex-col gap-3 text-xs animate-fade-in shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Executive Analysis</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed mt-0.5 font-medium">
                  {explanation.executiveSummary}
                </p>
              </div>

              {explanation.spatialAnalysis && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Spatial Breakdown</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                    {explanation.spatialAnalysis}
                  </p>
                </div>
              )}

              {explanation.primaryBottleneck && (
                <div className="bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Key Statutory Bottleneck</span>
                  <p className="text-amber-950 dark:text-amber-200 font-medium mt-0.5">
                    {explanation.primaryBottleneck}
                  </p>
                </div>
              )}

              {Array.isArray(explanation.actionableAdvice) && explanation.actionableAdvice.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    Actionable Advice for Developer / Architect
                  </span>
                  <ul className="flex flex-col gap-1.5 mt-1.5">
                    {explanation.actionableAdvice.map((adv, i) => (
                      <li key={i} className="text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rule Source Citation */}
      <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Statutory Rule Source
        </span>

        {result.rulesSource ? (
          <div className="flex items-start gap-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-lg px-3 py-2.5 animate-fade-in">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-200 leading-tight break-words">
                {result.rulesSource}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                Zoning Code: {result.zoneCode || 'IND-1'} · {result.zoneName || 'Industrial Use Zone'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700 leading-relaxed">
            <strong>Statutory Basis:</strong> Tamil Nadu Combined Development and Building Rules, 2019 (TNCDBR-2019), Rule 36.
          </div>
        )}

        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Subject to municipal site verification by the Local Planning Authority (LPA). Values are as encoded in the pilot rule set and may differ from amendments post 2019.
        </p>
      </div>
    </div>
  );
}
