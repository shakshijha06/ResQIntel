import React, { useState, useEffect } from 'react';
import { 
  GitMerge, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Check, 
  ArrowRight,
  Sparkles,
  Brain,
  TrendingUp,
  FileText,
  Layers,
  RefreshCw
} from 'lucide-react';
import { getAdminReviews, submitAdminReviewDecision, getAiReviewAnalysis } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';

export const ReviewCentrePage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getAdminReviews();
      setReviews(data || []);
      if (data && data.length > 0 && !activeReviewId) {
        const firstPending = data.find((r) => r.status === 'pending') || data[0];
        setActiveReviewId(firstPending.review_id);
      }
    } catch (err) {
      console.error('Failed to load review items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decisionType) => {
    if (!activeReviewId) return;

    try {
      setSubmittingDecision(true);
      await submitAdminReviewDecision(activeReviewId, {
        decision: decisionType,
        reviewer_notes: reviewerNotes || `Decision recorded as: ${decisionType.replace(/_/g, ' ')}`
      });

      setActionSuccessMessage(`Review decision saved: ${decisionType.replace(/_/g, ' ')}`);
      setReviewerNotes('');
      setTimeout(() => setActionSuccessMessage(null), 3500);

      await loadReviews();
    } catch (err) {
      alert('Error saving decision: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!activeReviewId) return;
    try {
      setAiAnalyzing(true);
      setAiAnalysis(null);
      const res = await getAiReviewAnalysis(activeReviewId);
      setAiAnalysis(res);
    } catch (err) {
      alert('AI comparison error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAiAnalyzing(false);
    }
  };

  const currentReview = reviews.find((r) => r.review_id === activeReviewId);
  const reportA = currentReview?.reports?.[0];
  const reportB = currentReview?.reports?.[1];

  const getReportText = (rep, fallbackId) => {
    if (rep?.original_text && rep.original_text.trim() && !rep.original_text.includes('loading')) {
      return rep.original_text;
    }
    return `Report ${fallbackId || 'details'} submitted through civic portal.`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">Triage & Reconciliation</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5">Review Reports</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Compare incoming citizen reports side-by-side to detect duplicates, group related issues, or identify updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReviews}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            {reviews.filter((r) => r.status === 'pending').length} Awaiting Decision
          </span>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0 w-full">
        {/* Left Sidebar: Review Queue (4 Cols) */}
        <div className="lg:col-span-4 card p-4 flex flex-col justify-between max-h-[360px] lg:max-h-[750px] overflow-hidden border border-white/10 min-w-0">
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
            <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold block px-1 mb-2">
              Review Queue ({reviews.length})
            </span>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#94A3B8]">
                Retrieving candidate pairs...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#94A3B8]">
                No reports currently require manual review.
              </div>
            ) : (
              reviews.map((rev) => {
                const isSelected = activeReviewId === rev.review_id;
                const isResolved = rev.status === 'resolved';

                return (
                  <div
                    key={rev.review_id}
                    onClick={() => {
                      setActiveReviewId(rev.review_id);
                      setReviewerNotes(rev.reviewer_notes || '');
                      setAiAnalysis(null);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#1B2A4A] border-[#FF6B58] shadow-md shadow-[#FF6B58]/10'
                        : 'bg-[#0D1527] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold text-[#FF6B58]">
                        {rev.review_id}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border ${
                          isResolved
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-[#F8FAFC] line-clamp-1">
                      {rev.suggested_decision?.replace(/_/g, ' ') || 'Potential duplicate'}
                    </div>

                    <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center justify-between">
                      <span className="font-mono text-[10px]">{rev.report_ids?.join(' ↔ ')}</span>
                      {rev.reviewer_decision && (
                        <span className="text-emerald-400 font-medium text-[10px]">
                          ✓ {rev.reviewer_decision.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Side-by-Side Comparison Workspace (8 Cols) */}
        <div className="lg:col-span-8 card-elevated p-4 sm:p-6 space-y-6 border border-white/10 min-w-0">
          {currentReview ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#FF6B58]">
                      {currentReview.review_id}
                    </span>
                    <span className="text-xs text-white/20">•</span>
                    <span className="text-xs text-[#94A3B8] font-medium">
                      Relationship: <span className="text-[#F8FAFC] font-semibold">{currentReview.comparison_classification?.replace(/_/g, ' ') || currentReview.suggested_decision?.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                </div>

                <StatusBadge status={currentReview.status} />
              </div>

              {/* Side-by-Side Original Report Preservations */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold block">
                  Original Citizen Reports (Verbatim Side-by-Side)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Report A */}
                  <div className="p-4 rounded-xl bg-[#0D1527] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
                      <span className="font-mono text-xs font-bold text-[#FF6B58]">
                        Report A: {reportA?.report_id || currentReview.report_ids?.[0]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#F8FAFC] font-mono">
                        {reportA?.language?.toUpperCase() || 'EN'}
                      </span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] leading-relaxed italic bg-white/5 p-3 rounded-lg border border-white/5 font-sans">
                      "{getReportText(reportA, currentReview.report_ids?.[0])}"
                    </p>

                    <div className="text-[11px] text-[#94A3B8] space-y-0.5 pt-1">
                      <div><span className="font-medium text-[#F8FAFC]">Location:</span> {reportA?.raw_location || reportA?.city || 'Location logged'}</div>
                      <div><span className="font-medium text-[#F8FAFC]">Category:</span> {reportA?.disaster_type?.replace(/_/g, ' ') || 'Civic issue'}</div>
                    </div>
                  </div>

                  {/* Report B */}
                  <div className="p-4 rounded-xl bg-[#0D1527] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
                      <span className="font-mono text-xs font-bold text-[#FF6B58]">
                        Report B: {reportB?.report_id || currentReview.report_ids?.[1]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#F8FAFC] font-mono">
                        {reportB?.language?.toUpperCase() || 'EN'}
                      </span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] leading-relaxed italic bg-white/5 p-3 rounded-lg border border-white/5 font-sans">
                      "{getReportText(reportB, currentReview.report_ids?.[1])}"
                    </p>

                    <div className="text-[11px] text-[#94A3B8] space-y-0.5 pt-1">
                      <div><span className="font-medium text-[#F8FAFC]">Location:</span> {reportB?.raw_location || reportB?.city || 'Location logged'}</div>
                      <div><span className="font-medium text-[#F8FAFC]">Category:</span> {reportB?.disaster_type?.replace(/_/g, ' ') || 'Civic issue'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Factors */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold block">
                  Similarity Indicators
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-[#94A3B8]">Distance Apart</span>
                    <div className="font-medium text-[#F8FAFC]">
                      {currentReview.location_comparison?.distance_km !== null && currentReview.location_comparison?.distance_km !== undefined
                        ? `${(currentReview.location_comparison?.distance_km * 1000).toFixed(0)} meters apart`
                        : 'Nearby vicinity'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-[#94A3B8]">Timing Delta</span>
                    <div className="font-medium text-[#F8FAFC]">
                      {currentReview.timestamp_comparison?.time_difference || 'Reported around same timeframe'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D1527] border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-[#94A3B8]">Category Check</span>
                    <div className="font-medium text-emerald-400">
                      {currentReview.disaster_type_comparison?.match !== false ? 'Matching Category' : 'Different Categories'}
                    </div>
                  </div>
                </div>

                {/* Plain English explanation */}
                {currentReview.reasons && currentReview.reasons.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-medium text-[#CBD5E1] block mb-1">
                      Why these may refer to the same problem:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-[#94A3B8]">
                      {currentReview.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AI Assistant Comparison Panel */}
              <div className="p-4 rounded-xl bg-[#0D1527] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B58]" />
                    <span>AI Reconciliation Analysis</span>
                  </div>
                  {!aiAnalysis && (
                    <button
                      type="button"
                      disabled={aiAnalyzing}
                      onClick={handleRunAiAnalysis}
                      className="px-3 py-1 rounded-lg bg-[#FF6B58] hover:bg-[#FF8575] disabled:opacity-50 text-[#0D1527] text-xs font-semibold transition-colors"
                    >
                      {aiAnalyzing ? 'Analyzing…' : 'Run AI Analysis'}
                    </button>
                  )}
                  {aiAnalysis && (
                    <button
                      type="button"
                      onClick={() => setAiAnalysis(null)}
                      className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {!aiAnalysis && !aiAnalyzing && (
                  <p className="text-xs text-[#94A3B8]">
                    Generate an explainable AI assessment of whether these two citizen reports describe the same problem or separate events.
                  </p>
                )}

                {aiAnalyzing && (
                  <div className="py-4 text-center text-xs text-[#94A3B8] font-mono animate-pulse">
                    Analyzing report texts, location, and severity...
                  </div>
                )}

                {aiAnalysis && aiAnalysis.is_success && (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      aiAnalysis.overall_recommendation === 'confirm_match'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : aiAnalysis.overall_recommendation === 'mark_non_match'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}>
                      <Brain className="w-4 h-4 shrink-0" />
                      <span>Recommendation: {aiAnalysis.overall_recommendation?.replace(/_/g, ' ')}</span>
                      <span className="ml-auto text-[11px] opacity-75">{aiAnalysis.confidence_label} Confidence</span>
                    </div>

                    {aiAnalysis.plain_english_explanation && (
                      <p className="text-xs text-[#CBD5E1] bg-[#14213D] p-3 rounded-xl border border-white/10 leading-relaxed">
                        {aiAnalysis.plain_english_explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Reviewer Actions */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Reviewer Notes / Verification Details
                  </label>
                  <textarea
                    rows={2}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter any notes on ground confirmation or reasons for this decision..."
                    className="form-input text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-[#94A3B8]">
                    {currentReview.status === 'resolved' ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ Registered Decision: {currentReview.reviewer_decision?.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      'Choose an action to resolve this review pair.'
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('mark_uncertain')}
                      className="btn-secondary text-xs"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Uncertain</span>
                    </button>

                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('mark_non_match')}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Different Issues</span>
                    </button>

                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('confirm_match')}
                      className="btn-primary text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Same Problem (Group)</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-[#94A3B8]">
              Select a candidate pair from the queue to start verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
