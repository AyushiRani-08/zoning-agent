'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import { reportsApi } from '../../lib/api';
import VerdictBadge from '../../components/VerdictBadge';
import { FolderCheck, Download, Trash2, LogIn, ChevronLeft, ChevronRight, FileText, Calendar } from 'lucide-react';

export default function ReportsDashboardPage() {
  const { token, user, loading: authLoading } = useAuth();

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchReports = async (targetPage = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.list(token, targetPage, 10);
      setReports(data.reports);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      setError(err.message || 'Failed to load saved reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReports(page);
    } else {
      setLoading(false);
    }
  }, [token, page]);

  const handleDownload = async (reportId) => {
    setDownloadingId(reportId);
    try {
      await reportsApi.downloadPdf(reportId, token);
    } catch (err) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this feasibility report?')) return;
    try {
      await reportsApi.deleteById(reportId, token);
      fetchReports(page);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <FolderCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Sign in to view saved reports</h2>
          <p className="text-xs text-slate-500">
            Studies you evaluate while logged in are automatically saved to your account and backed up on MongoDB.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Your Account</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-blue-600" />
            Saved Feasibility Studies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical assessments, zoning clearance snapshots, and downloadable PDF reports.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <span>+ New Feasibility Study</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading your saved reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center gap-3">
          <FileText className="w-10 h-10 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No saved reports yet</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Evaluate a parcel on the Map Studio to automatically save and track your feasibility history.
          </p>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:underline mt-2"
          >
            Launch Map Studio &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref / Date</th>
                  <th className="py-3 px-4">Intended Use</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Plot Area</th>
                  <th className="py-3 px-4">Buildable</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => {
                  const dateStr = new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        <div>#{r._id.slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 capitalize">
                        {r.intendedUse.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.zoneCode || 'IND-1'}
                      </td>
                      <td className="py-3.5 px-4">
                        <VerdictBadge verdict={r.verdict} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {r.plotAreaSqM ? `${Math.round(r.plotAreaSqM).toLocaleString()} m²` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {r.buildableFootprintSqM ? `${Math.round(r.buildableFootprintSqM).toLocaleString()} m²` : '0 m²'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(r._id)}
                            disabled={downloadingId === r._id}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md font-semibold text-[11px] transition-all"
                            title="Download PDF Report"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => handleDelete(r._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing page {page} of {pages} ({total} total studies)</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded border border-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="p-1 rounded border border-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

