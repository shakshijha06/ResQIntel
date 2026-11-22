import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Layers,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { getPublicIncidentDetail } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';

export const PublicIncidentDetailPage = () => {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const data = await getPublicIncidentDetail(id);
        setIncident(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Incident bulletin not found or unpublished.');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center text-xs text-[#94A3B8]">
        Loading public incident bulletin...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="card p-8 border-red-500/30 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-[#F8FAFC]">Incident Not Available</h2>
          <p className="text-xs text-[#94A3B8]">{error}</p>
          <div className="pt-2">
            <Link
              to="/explore"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Incidents</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <Link
          to="/explore"
          className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Incidents</span>
        </Link>
        <span className="text-xs font-mono text-[#94A3B8]">{incident.incident_id}</span>
      </div>

      {/* Main card */}
      <div className="card-elevated p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <DisasterPill type={incident.disaster_type} />
            <StatusBadge status={incident.current_status} />
          </div>
          <span className="text-xs text-[#94A3B8]">
            Last Updated: {new Date(incident.updated_at || incident.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] leading-tight">
            {incident.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8] mt-2">
            <div className="flex items-center gap-1 font-medium text-[#F8FAFC]">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{incident.location}{incident.state ? `, ${incident.state}` : ''}</span>
            </div>
            {incident.report_count && (
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#FF6B58]" />
                <span>{incident.report_count} community {incident.report_count === 1 ? 'report' : 'reports'} grouped</span>
              </div>
            )}
          </div>
        </div>

        {/* Public Summary */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold block">
            Public Incident Summary
          </label>
          <p className="p-4 bg-[#0D1527] rounded-xl border border-white/10 text-[#CBD5E1] text-sm leading-relaxed font-sans">
            {incident.public_summary || incident.summary || 'Details for this incident are being compiled.'}
          </p>
        </div>

        {/* Assigned Department if any */}
        {incident.assigned_department && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-sm">Assigned Authority</span>
              <span className="text-blue-300/80">{incident.assigned_department}</span>
            </div>
          </div>
        )}

        {/* Action Updates Timeline */}
        {incident.action_updates && incident.action_updates.length > 0 && (
          <div className="space-y-3 pt-2">
            <label className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold block">
              Official Progress Timeline
            </label>
            <div className="space-y-2.5">
              {incident.action_updates.map((act, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#0D1527] border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {act.status_at_time && (
                      <span className="capitalize font-semibold text-[#FF6B58] bg-[#FF6B58]/10 px-2 py-0.5 rounded">
                        {act.status_at_time.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed pt-1">{act.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Emergency reminder */}
      <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <p>
          <strong>Life-threatening hazard?</strong> Call emergency services at <strong>112</strong> immediately.
        </p>
      </div>
    </div>
  );
};
