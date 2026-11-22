import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, AlertTriangle, 
  FileText, CheckCircle2, Shield, AlertCircle, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';

export const PublicReportDetailPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/public/reports/${id}`);
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Report not found or not published.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#94A3B8]">
        Loading report details...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 rounded-xl card border-red-500/30 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-[#F8FAFC]">Report Unavailable</h2>
          <p className="text-xs text-[#94A3B8] mt-1">{error || 'This report is unavailable.'}</p>
          <div className="mt-4">
            <Link to="/reports" className="btn-secondary text-xs inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <Link to="/reports" className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Reports
        </Link>
        <span className="font-mono text-xs font-semibold text-[#FF6B58] bg-[#FF6B58]/10 px-2 py-0.5 rounded border border-[#FF6B58]/20">
          {report.report_id}
        </span>
      </div>

      {/* Main card */}
      <div className="card-elevated p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <DisasterPill type={report.disaster_type} />
            <span className="text-xs text-[#94A3B8]">
              Submitted: {new Date(report.created_at || report.reported_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </span>
          </div>
          <span className="text-xs text-[#94A3B8] font-medium">
            Language: {report.language?.toUpperCase() || 'EN'}
          </span>
        </div>

        {/* Verbatim text */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold block">
            Report Description (Preserved Verbatim)
          </label>
          <p className="p-4 bg-[#0D1527] rounded-xl border border-white/10 text-[#F8FAFC] text-sm leading-relaxed italic font-sans">
            "{report.original_text}"
          </p>
        </div>

        {/* Geographic location info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0D1527] border border-white/10 space-y-1">
            <span className="text-[#94A3B8] block text-[11px] uppercase tracking-wider">Reported Location</span>
            <div className="flex items-center gap-1 font-medium text-[#F8FAFC]">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{report.raw_location || report.city || 'Not specified'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1527] border border-white/10 space-y-1">
            <span className="text-[#94A3B8] block text-[11px] uppercase tracking-wider">State / Region</span>
            <span className="font-medium text-[#F8FAFC] block">{report.state || 'India'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1527] border border-white/10 space-y-1">
            <span className="text-[#94A3B8] block text-[11px] uppercase tracking-wider">Coordinates</span>
            <span className="font-mono text-[#F8FAFC] block">
              {report.latitude ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : 'Not pinned'}
            </span>
          </div>
        </div>

        {/* Incident link if grouped */}
        {report.associated_incident_id && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-blue-200 block text-sm">Organized into Public Incident</span>
              <span className="text-blue-300/80">This report has been reviewed and grouped with other observations under Incident #{report.associated_incident_id}.</span>
            </div>
            <Link
              to={`/incident/${report.associated_incident_id}`}
              className="btn-primary text-xs shrink-0 inline-flex items-center gap-1"
            >
              <span>View Incident Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Emergency notice */}
      <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <p>
          <strong>Notice:</strong> This is a civic report record. If an active emergency threatens human life, dial <strong>112</strong> immediately.
        </p>
      </div>
    </div>
  );
};
