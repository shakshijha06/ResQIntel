import React, { useState } from 'react';
import { Search, MapPin, AlertCircle, CheckCircle2, ArrowRight, Clock, Tag } from 'lucide-react';
import { trackPublicSubmission } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';

const CATEGORY_LABEL = {
  pothole: 'Pothole / Damaged Road',
  broken_footpath: 'Broken Footpath or Pavement',
  road_obstruction: 'Road Obstruction',
  traffic_signal: 'Traffic Signal Problem',
  poor_streetlighting: 'Poor Street Lighting / Dark Road',
  waterlogging: 'Waterlogging / Flooded Road',
  drainage_blockage: 'Blocked or Overflowing Drain',
  water_supply: 'Water Supply Interruption',
  water_leakage: 'Water Pipeline Leakage',
  garbage_accumulation: 'Garbage Accumulation',
  waste_collection: 'Irregular Waste Collection',
  overflowing_bins: 'Overflowing Garbage Bins',
  illegal_dumping: 'Illegal Waste Dumping',
  public_sanitation: 'Public Sanitation Problem',
  streetlight_failure: 'Streetlight Failure',
  electrical_infrastructure: 'Damaged Electrical Infrastructure',
  damaged_public_building: 'Damaged Public Building or Facility',
  unsafe_structure: 'Unsafe Public Structure',
  broken_facility: 'Broken Public Facility',
  fallen_tree: 'Fallen Tree',
  air_pollution: 'Air Pollution Complaint',
  water_pollution: 'Water Pollution',
  flood: 'Flooding Emergency',
  fire: 'Fire',
  earthquake: 'Earthquake',
  landslide: 'Landslide',
  cyclone: 'Cyclone / Severe Storm',
  other: 'Other',
};

export const PublicTrackPage = () => {
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!referenceId.trim()) {
      setError('Please enter your Reference ID.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Pass empty string token — backend accepts reference_id alone
      const res = await trackPublicSubmission(referenceId.trim(), '');
      setTrackingData(res);
    } catch (err) {
      setTrackingData(null);
      setError(
        err.response?.data?.detail ||
        'No report found with that Reference ID. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">
          Citizen Report Verification
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC]">
          Track Your Report
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto">
          Enter your Reference ID (e.g. RSQ-8B291A or RPT-2026-0001) to check the live operational status of your submission.
        </p>
      </div>

      {/* Search Form */}
      <div className="card-elevated p-6 sm:p-8 space-y-5 border border-white/10">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="form-label">
              Reference ID <span className="text-[#FF6B58]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RSQ-8B291A or RPT-2026-0001"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="form-input font-mono text-sm uppercase"
            />
            <p className="text-[11px] text-[#94A3B8] mt-1.5">
              The reference ID was displayed on screen when you submitted your report.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Querying records...' : 'Track Report Status'}
          </button>
        </form>
      </div>

      {/* Result */}
      {trackingData && (
        <div className="card-elevated p-6 sm:p-8 space-y-5 border border-white/15 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="font-mono text-lg font-bold text-[#FF6B58]">{trackingData.reference_id}</span>
              <div className="text-xs text-[#94A3B8] mt-0.5">
                Logged: {trackingData.received_at ? new Date(trackingData.received_at).toLocaleString() : '—'}
              </div>
            </div>
            <StatusBadge status={trackingData.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0D1527] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-1">
                <Tag className="w-3.5 h-3.5 text-[#FF6B58]" /> Category
              </div>
              <div className="font-medium text-[#F8FAFC] text-sm capitalize">
                {CATEGORY_LABEL[trackingData.disaster_type] || trackingData.disaster_type || '—'}
              </div>
            </div>

            <div className="bg-[#0D1527] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Location
              </div>
              <div className="font-medium text-[#F8FAFC] text-sm">
                {trackingData.generalized_location || '—'}
              </div>
            </div>
          </div>

          {trackingData.status_explanation && (
            <div className="bg-blue-950/40 rounded-xl border border-blue-500/30 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Latest Review Status
              </div>
              <p className="text-xs sm:text-sm text-[#F8FAFC] leading-relaxed">
                {trackingData.status_explanation}
              </p>
            </div>
          )}

          {trackingData.published_incident_id && (
            <div className="pt-2 flex justify-end">
              <Link
                to={`/incident/${trackingData.published_incident_id}`}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <span>View Public Incident Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Help tip */}
      {!trackingData && (
        <div className="glass-panel border border-white/10 rounded-xl p-4 text-xs text-[#CBD5E1] space-y-1">
          <strong className="text-[#FF6B58]">Tip:</strong> Reference IDs look like <span className="font-mono text-[#F8FAFC] font-semibold">RSQ-XXXXXX</span> or <span className="font-mono text-[#F8FAFC] font-semibold">RPT-2026-XXXX</span>.
          If you did not save your reference ID, you can also search the <Link to="/explore" className="text-[#FF6B58] hover:underline font-medium">Public Incidents Explorer</Link> or{' '}
          <Link to="/report" className="text-[#FF6B58] hover:underline font-medium">submit a new observation</Link>.
        </div>
      )}
    </div>
  );
};
