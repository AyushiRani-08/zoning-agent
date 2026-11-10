'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import LeafletMap with SSR disabled
const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 gap-3">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Initializing GIS Map Canvas...</span>
    </div>
  ),
});

export default function MapView(props) {
  return <DynamicLeafletMap {...props} />;
}

