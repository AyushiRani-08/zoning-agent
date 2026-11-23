'use client';

import React, { useState } from 'react';
import { Key, Sparkles, CheckCircle2, AlertTriangle, ExternalLink, X, ShieldCheck, MapPin, Cpu } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                API Key & Service Architecture
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Required services, AI models, and credentials
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Required Key Section */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                Primary API Key: Google Gemini
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Configured on Server
            </span>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              The only external API key required by this application is <strong>Google Gemini API Key (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">GEMINI_API_KEY</code>)</strong>.
            </p>
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3 space-y-1.5 text-[11px]">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" /> Model: <code>gemini-3.8-flash</code> via <code>@google/genai</code>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                <strong>What it powers:</strong> Natural language planning explanations, executive feasibility summaries, and automated bylaw parameter extraction from gazette text.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Where it is set:</strong> In your root backend configuration file: <code className="text-blue-600 dark:text-blue-400">server/.env</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Zero-Key Modules (GIS & Calculations) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            What Works Without Any API Key
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span><strong>Map Tiles:</strong> OpenStreetMap & CartoDB are open-source and free (no Mapbox token needed).</span>
            </div>
            <div className="flex items-start gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Zoning Engine:</strong> Pure Turf.js & local metric setbacks (no cloud calculator required).</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <span>Get a free Gemini API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

