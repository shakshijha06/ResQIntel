import React, { useState, useEffect, useRef } from 'react';
import { FilePlus, MapPin, AlertCircle, CheckCircle2, ArrowRight, Upload, X, Image as ImageIcon } from 'lucide-react';
import { submitPublicReport } from '../../services/api';
import { Link } from 'react-router-dom';
import { LocationPickerMap } from '../../components/LocationPickerMap';

const EMERGENCY_TYPES = new Set(['flood', 'fire', 'earthquake', 'landslide', 'cyclone']);

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole / Damaged Road' },
  { value: 'broken_footpath', label: 'Broken Footpath or Pavement' },
  { value: 'road_obstruction', label: 'Road Obstruction' },
  { value: 'traffic_signal', label: 'Traffic Signal Problem' },
  { value: 'poor_streetlighting', label: 'Poor Street Lighting / Dark Road' },
  { value: 'waterlogging', label: 'Waterlogging / Flooded Road' },
  { value: 'drainage_blockage', label: 'Blocked or Overflowing Drain' },
  { value: 'water_supply', label: 'Water Supply Interruption' },
  { value: 'water_leakage', label: 'Water Pipeline Leakage' },
  { value: 'garbage_accumulation', label: 'Garbage Accumulation' },
  { value: 'waste_collection', label: 'Irregular Waste Collection' },
  { value: 'overflowing_bins', label: 'Overflowing Garbage Bins' },
  { value: 'illegal_dumping', label: 'Illegal Waste Dumping' },
  { value: 'public_sanitation', label: 'Public Sanitation Problem' },
  { value: 'streetlight_failure', label: 'Streetlight Failure' },
  { value: 'electrical_infrastructure', label: 'Damaged Electrical Infrastructure' },
  { value: 'damaged_public_building', label: 'Damaged Public Building or Facility' },
  { value: 'unsafe_structure', label: 'Unsafe Public Structure' },
  { value: 'broken_facility', label: 'Broken Public Facility' },
  { value: 'fallen_tree', label: 'Fallen Tree' },
  { value: 'air_pollution', label: 'Air Pollution Complaint' },
  { value: 'water_pollution', label: 'Water Pollution' },
  { value: 'flood', label: 'Flooding Emergency' },
  { value: 'fire', label: 'Fire' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'cyclone', label: 'Cyclone / Severe Storm' },
  { value: 'other', label: 'Other (please describe)' },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PublicReportPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'pothole';

  const [formData, setFormData] = useState({
    disaster_type: initialCategory,
    raw_location: '',
    state: '',
    district: '',
    city: '',
    latitude: '',
    longitude: '',
    report_description: '',
    observation_time: '',
    language: 'en',
    reporter_name: '',
    contact_info: '',
    supporting_evidence: ''
  });

  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      files.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    };
  }, [files]);

  const handleFileChange = (e) => {
    setFileError('');
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    if (files.length + newFiles.length > MAX_FILES) {
      setFileError(`You can upload at most ${MAX_FILES} files.`);
      return;
    }

    const validFiles = [];
    for (const f of newFiles) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setFileError(`Unsupported file type: ${f.name}. Use JPG, PNG, WebP, GIF, or MP4.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`File too large: ${f.name} (${formatFileSize(f.size)}). Max size is 5MB.`);
        return;
      }
      const previewUrl = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
      validFiles.push({ file: f, name: f.name, size: f.size, type: f.type, previewUrl });
    }

    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => {
      const removed = prev[index];
      if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Called when LocationPickerMap updates coordinates or reverse geocode details
  const handleLocationChange = (loc) => {
    setFormData((prev) => {
      const updates = {
        ...prev,
        latitude: loc.latitude !== undefined ? loc.latitude : prev.latitude,
        longitude: loc.longitude !== undefined ? loc.longitude : prev.longitude,
      };

      // Only auto-populate text fields if they are currently blank or from an automated pin
      if (loc.raw_location && (!prev.raw_location || prev.raw_location.trim() === '')) {
        updates.raw_location = loc.raw_location;
      } else if (loc.raw_location && !prev.raw_location) {
        updates.raw_location = loc.raw_location;
      }

      if (loc.city && (!prev.city || prev.city.trim() === '')) {
        updates.city = loc.city;
      }
      if (loc.district && (!prev.district || prev.district.trim() === '')) {
        updates.district = loc.district;
      }
      if (loc.state && (!prev.state || prev.state.trim() === '')) {
        updates.state = loc.state;
      }

      return updates;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.raw_location.trim() || !formData.report_description.trim()) {
      setError('Please provide both the location and a description of the issue.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let evidencePayload = formData.supporting_evidence || '';
      if (files.length > 0) {
        try {
          const encoded = await Promise.all(
            files.map(async f => ({
              name: f.name,
              size: f.size,
              type: f.type,
              data: await fileToBase64(f.file)
            }))
          );
          evidencePayload = JSON.stringify(encoded);
        } catch (fileErr) {
          console.warn('File encoding error:', fileErr);
        }
      }

      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        observation_time: formData.observation_time || new Date().toISOString(),
        supporting_evidence: evidencePayload,
        language: 'en'
      };

      const res = await submitPublicReport(payload);
      setSubmissionResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setFiles([]);
    setFormData({
      disaster_type: 'pothole',
      raw_location: '',
      state: '',
      district: '',
      city: '',
      latitude: '',
      longitude: '',
      report_description: '',
      observation_time: '',
      language: 'en',
      reporter_name: '',
      contact_info: '',
      supporting_evidence: ''
    });
  };

  const isEmergency = EMERGENCY_TYPES.has(formData.disaster_type);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#F8FAFC] font-normal">
          Report a Civic Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Submit details about potholes, waterlogging, broken streetlights, garbage, or other neighborhood problems. Submissions are reviewed and organized for municipal action.
        </p>
      </div>

      {submissionResult ? (
        /* Confirmation Panel */
        <div className="glass-panel-elevated p-6 sm:p-8 rounded-2xl border border-emerald-500/30 space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <h2 className="font-serif text-2xl text-white">Report Successfully Logged</h2>
              <p className="text-xs text-slate-300">Your observation has been saved in the municipal queue.</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0D1527]/80 border border-white/10 space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Reference Number</div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-[#FF6B58]">
              {submissionResult.reference_id}
            </div>
            <p className="text-xs text-slate-300 pt-1">
              Please save this reference number. You can use it to track resolution status at any time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/track"
              className="btn-primary text-xs py-2.5"
            >
              <span>Track this report</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleReset}
              className="btn-secondary text-xs py-2.5"
            >
              Submit another report
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Emergency Reminder:</strong> For immediate life-threatening situations, dial <strong>112</strong> directly.
            </p>
          </div>
        </div>
      ) : (
        /* Report Form */
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-7 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Category */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-[#FF6B58] font-bold">
              1. Issue Classification
            </h3>

            <div>
              <label className="form-label">
                Problem Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.disaster_type}
                onChange={(e) => setFormData({ ...formData, disaster_type: e.target.value })}
                className="form-input text-xs bg-[#0D1527]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-[#14213D]">{cat.label}</option>
                ))}
              </select>
            </div>

            {isEmergency && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p className="text-[11px]">
                  ⚠️ For immediate life-threatening emergencies, call <strong>112</strong> immediately. You may continue here to log a civic record.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Geographic Location Details (TomTom Integration) */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-[#FF6B58] font-bold">
                2. Geographic Location Details
              </h3>
              <span className="text-[10px] text-slate-400">Powered by TomTom Maps</span>
            </div>

            {/* Interactive TomTom Map with Places Search & Geolocation */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center justify-between">
                <span>Pinpoint Issue Location</span>
                <span className="text-[10px] text-slate-400">Search place, use GPS, or click & drag pin</span>
              </label>
              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                initialAddress={formData.raw_location}
                onLocationChange={handleLocationChange}
              />
            </div>

            <div>
              <label className="form-label">
                Approximate Location / Street / Landmark <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Near Naskarpara Main Road or Park Street Metro Station"
                value={formData.raw_location}
                onChange={(e) => setFormData({ ...formData, raw_location: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label">State / UT</label>
                <input
                  type="text"
                  placeholder="e.g. West Bengal"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
              <div>
                <label className="form-label">District</label>
                <input
                  type="text"
                  placeholder="e.g. North 24 Parganas"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
              <div>
                <label className="form-label">City / Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Kolkata"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 22.5726"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 88.3639"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Description & Photos */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-xs uppercase tracking-wider text-[#FF6B58] font-bold">
              3. Observation Description & Photos
            </h3>

            <div>
              <label className="form-label">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the issue in detail — water level, traffic blockage, danger to pedestrians, or time observed..."
                value={formData.report_description}
                onChange={(e) => setFormData({ ...formData, report_description: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            {/* Direct File Picker */}
            <div className="space-y-3">
              <label className="form-label">
                Upload Photographs / Videos (Optional, max 3 files)
              </label>
              <p className="text-[11px] text-slate-400">
                Directly attach photos from your phone or computer gallery. Up to 5MB each.
              </p>

              {fileError && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Upload Drop Zone / Input */}
              {files.length < MAX_FILES && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 hover:border-[#FF6B58]/50 rounded-xl cursor-pointer bg-[#0D1527]/50 hover:bg-[#0D1527] transition-all"
                  >
                    <Upload className="w-6 h-6 text-[#FF6B58] mb-1.5" />
                    <span className="text-xs font-semibold text-white">Choose photos or click to browse</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                  </label>
                </div>
              )}

              {/* Thumbnail previews */}
              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {files.map((f, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0D1527] p-2 space-y-1.5">
                      {f.previewUrl ? (
                        <img
                          src={f.previewUrl}
                          alt={f.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-white/5 rounded-lg text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="truncate max-w-[120px] text-slate-300">{f.name}</span>
                        <span className="text-slate-500 text-[10px]">{formatFileSize(f.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="absolute top-3 right-3 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Optional Reporter Info */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              4. Reporter Details (Optional & Kept Confidential)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Anonymous"
                  value={formData.reporter_name}
                  onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
              <div>
                <label className="form-label">Contact Phone / Email (Optional)</label>
                <input
                  type="text"
                  placeholder="Used strictly if verification team requires clarity"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              Submissions enter the verification intake queue before public release.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto px-7 py-2.5 text-xs font-semibold"
            >
              {submitting ? 'Submitting securely...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
