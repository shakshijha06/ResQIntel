import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, MapPin, Clock, Globe2, Database,
  CheckCircle2, AlertTriangle, XCircle, Sparkles, Eye,
  Info, ChevronRight, Layers, GitMerge, Shield, Hash
} from 'lucide-react';
import { getAdminReportDetail, testGeminiExtraction } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';
import api from '../../services/api';

const FieldRow = ({ label, value, mono = false, warn = false }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-[#F4EDE0]/5 last:border-0">
      <span className="text-[11px] text-[#F4EDE0]/40 uppercase tracking-wider font-medium sm:w-44 shrink-0">{label}</span>
      <span className={`text-xs ${mono ? 'font-mono' : ''} ${warn ? 'text-amber-300' : 'text-[#F4EDE0]/80'} break-all`}>
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
      </span>
    </div>
  );
};

const Section = ({ title, icon: Icon, iconColor = 'text-[#FF6B58]', children, badge }) => (
  <div className="glass-panel rounded-2xl p-5 border border-[#F4EDE0]/10 space-y-3">
    <div className="flex items-center justify-between pb-2 border-b border-[#F4EDE0]/10">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h2 className="font-serif text-base text-[#F4EDE0]">{title}</h2>
      </div>
      {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4EDE0]/10 text-[#F4EDE0]/60 font-mono">{badge}</span>}
    </div>
    {children}
  </div>
);

const LANGUAGE_LABELS = { en: 'English', hi: 'हिन्दी (Hindi)', bn: 'বাংলা (Bengali)' };
const SOURCE_LABELS = {
  'Public Community Portal': 'Public Submission',
  'synthetic': 'Synthetic Dataset',
};

export const AdminReportDetailPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState(null);
  const [extractError, setExtractError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminReportDetail(reportId);
        setReport(data);
        // If already extracted, show stored fields
        if (data.extracted_fields) {
          setExtractResult({ is_success: true, ...data.extracted_fields, status_message: 'Previously extracted and stored.' });
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reportId]);

  const handleExtract = async () => {
    if (!report) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await api.post(`/admin/reports/${reportId}/process`);
      setExtractResult(res.data.extracted_fields ? { is_success: true, ...res.data.extracted_fields, status_message: res.data.message } : { is_success: false, status_message: res.data.message });
      // Reload report to get updated fields
      const updated = await getAdminReportDetail(reportId);
      setReport(updated);
    } catch (err) {
      setExtractError(err.response?.data?.detail || 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-[#F4EDE0]/40">
        Loading report profile...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center space-y-3">
        <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-xs text-rose-300">{error || 'Report not found.'}</p>
        <button onClick={() => navigate('/admin/reports')} className="text-xs text-[#FF6B58] hover:underline">
          ← Back to Reports
        </button>
      </div>
    );
  }

  const ef = report.extracted_fields || {};
  const isSynthetic = report.data_origin === 'synthetic';
  const completenessFields = ['original_text', 'disaster_type', 'state', 'district', 'latitude', 'longitude', 'reported_at', 'source'];
  const filledCount = completenessFields.filter(f => report[f] !== null && report[f] !== undefined && report[f] !== '').length;
  const completenessScore = Math.round((filledCount / completenessFields.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/admin/reports')}
          className="mt-1 p-2 rounded-lg bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 text-[#F4EDE0]/60 hover:text-[#F4EDE0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[#FF6B58] bg-[#FF6B58]/10 px-2 py-0.5 rounded">
              {report.report_id}
            </span>
            <DisasterPill type={report.disaster_type} />
            <StatusBadge status={report.extraction_status} />
            {isSynthetic && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium">
                SYNTHETIC
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl text-[#F4EDE0]">Report Profile</h1>
          <p className="text-xs text-[#F4EDE0]/50 mt-0.5">
            {LANGUAGE_LABELS[report.language] || report.language} dispatch · Source: {report.source}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 glass-panel rounded-xl border border-[#F4EDE0]/10">
            <div className="text-lg font-serif text-[#F4EDE0]">{completenessScore}%</div>
            <div className="text-[10px] text-[#F4EDE0]/40">Data completeness</div>
          </div>
        </div>
      </div>

      {/* Completeness note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F4EDE0]/5 border border-[#F4EDE0]/10 text-xs text-[#F4EDE0]/60">
        <Info className="w-3.5 h-3.5 mt-0.5 text-[#FF6B58] shrink-0" />
        <span>
          <strong className="text-[#F4EDE0]/80">Data completeness ({completenessScore}%)</strong> measures how many structured fields are populated.
          It is <em>not</em> a credibility or truth score. Unverified reports must still be reviewed by a human analyst.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Original Source Information */}
        <Section title="Original Source Information" icon={FileText} badge={report.report_id}>
          <div className="space-y-0.5">
            <FieldRow label="Report ID" value={report.report_id} mono />
            <FieldRow label="Source" value={report.source} />
            <FieldRow label="Data Origin" value={report.data_origin} mono />
            <FieldRow label="Language" value={LANGUAGE_LABELS[report.language] || report.language} />
            <FieldRow label="Submission Time" value={report.received_at ? new Date(report.received_at).toLocaleString() : null} />
            <FieldRow label="Observation Time" value={report.reported_at ? new Date(report.reported_at).toLocaleString() : null} />
            <FieldRow label="Reported Condition" value={report.reported_condition} />
          </div>

          {/* Original text box */}
          <div className="mt-3">
            <div className="text-[11px] text-[#F4EDE0]/40 uppercase tracking-wider font-medium mb-2">
              Original Report Text (preserved verbatim)
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527]/60 border border-[#F4EDE0]/10 text-xs text-[#F4EDE0]/80 leading-relaxed whitespace-pre-wrap break-words font-mono">
              {report.original_text || <span className="text-[#F4EDE0]/30 italic">No text available</span>}
            </div>
          </div>
        </Section>

        {/* Geographic & Temporal */}
        <Section title="Location & Temporal Information" icon={MapPin} iconColor="text-blue-400">
          <div className="space-y-0.5">
            <FieldRow label="Raw Location" value={report.raw_location} />
            <FieldRow label="Normalised Location" value={report.normalized_location} />
            <FieldRow label="State" value={report.state} />
            <FieldRow label="District" value={report.district} />
            <FieldRow label="City" value={report.city} />
            <FieldRow label="Latitude" value={report.latitude} mono />
            <FieldRow label="Longitude" value={report.longitude} mono />
          </div>

          {report.latitude && report.longitude ? (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Coordinates available — this report can be plotted on the operational map.</span>
            </div>
          ) : (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>No coordinates available — location is based on text descriptions only.</span>
            </div>
          )}

          {report.associated_incident_id && (
            <div className="mt-3 p-3 rounded-xl bg-[#FF6B58]/5 border border-[#FF6B58]/20">
              <div className="text-[11px] text-[#F4EDE0]/40 uppercase tracking-wider mb-1">Associated Incident</div>
              <Link
                to={`/admin/incidents/${report.associated_incident_id}`}
                className="text-xs text-[#FF6B58] hover:underline font-mono flex items-center gap-1"
              >
                {report.associated_incident_id}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </Section>

        {/* AI Extraction */}
        <Section title="AI Extraction Results" icon={Sparkles} iconColor="text-purple-400"
          badge={report.extraction_status}>
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-200/70 mb-3">
            <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400" />
            <span>
              AI-extracted fields are stored separately from the original report text. The original is never modified.
              Extraction results are unverified and require human review before operational use.
            </span>
          </div>

          {Object.keys(ef).length > 0 ? (
            <div className="space-y-0.5">
              <FieldRow label="Disaster Type" value={ef.disaster_type} />
              <FieldRow label="Disaster Subtype" value={ef.disaster_subtype} />
              <FieldRow label="Extracted Location" value={ef.location} />
              <FieldRow label="State" value={ef.state} />
              <FieldRow label="District" value={ef.district} />
              <FieldRow label="City" value={ef.city} />
              <FieldRow label="Observation Time" value={ef.observation_time} />
              <FieldRow label="Reported Condition" value={ef.reported_condition} />
              <FieldRow label="Severity Indicators" value={ef.severity_indicators} />
              {ef.entities && ef.entities.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] text-[#F4EDE0]/40 uppercase tracking-wider font-medium mb-1.5">Named Entities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ef.entities.map((e, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-[#F4EDE0]/10 rounded-full text-[#F4EDE0]/70 font-mono">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="text-xs text-[#F4EDE0]/40">
                {report.extraction_status === 'raw'
                  ? 'This report has not been processed by the AI extraction pipeline yet.'
                  : 'No extraction data available.'}
              </div>
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={extracting}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-medium transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {extracting ? 'Running AI Extraction...' : Object.keys(ef).length > 0 ? 'Re-run AI Extraction' : 'Run AI Extraction'}
          </button>

          {extractError && (
            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {extractError}
            </div>
          )}
          {extractResult?.status_message && !extracting && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              {extractResult.status_message}
            </div>
          )}
        </Section>

        {/* Data Quality Assessment */}
        <Section title="Data Quality Assessment" icon={Eye} iconColor="text-amber-400">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#0D1527]/50 border border-[#F4EDE0]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#F4EDE0]/40 uppercase tracking-wider">Completeness</span>
                <span className="text-sm font-serif text-[#F4EDE0]">{completenessScore}%</span>
              </div>
              <div className="h-1.5 bg-[#F4EDE0]/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${completenessScore}%`,
                    background: completenessScore >= 75 ? '#10b981' : completenessScore >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {completenessFields.map(f => {
                const val = report[f];
                const present = val !== null && val !== undefined && val !== '';
                return (
                  <div key={f} className="flex items-center justify-between text-xs">
                    <span className="text-[#F4EDE0]/50 capitalize">{f.replace(/_/g, ' ')}</span>
                    {present
                      ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Present</span>
                      : <span className="text-amber-300/70 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing</span>
                    }
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-[#F4EDE0]/5 border border-[#F4EDE0]/10 text-[11px] text-[#F4EDE0]/50 leading-relaxed">
              <strong className="text-[#F4EDE0]/70">Note:</strong> This completeness score reflects how many structured
              fields are populated. It is not a measure of accuracy or credibility. Reports with high completeness
              may still contain incorrect information; reports with low completeness may still be accurate.
            </div>
          </div>
        </Section>
      </div>

      {/* Reconciliation info */}
      <Section title="Reconciliation & Matching" icon={GitMerge} iconColor="text-[#FF6B58]">
        <div className="text-xs text-[#F4EDE0]/50 p-4 rounded-xl bg-[#0D1527]/50 border border-[#F4EDE0]/10">
          <p>To view candidate report pairs and reconciliation decisions for this report, open the
          {' '}<Link to="/admin/reviews" className="text-[#FF6B58] hover:underline">Review Centre</Link>.
          Relationship classifications (duplicate, update, conflict, unrelated) are recorded there after human review.
          </p>
        </div>
      </Section>
    </div>
  );
};
