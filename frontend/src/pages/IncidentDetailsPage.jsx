import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Check, 
  Send, 
  Building, 
  UserCheck, 
  Calendar, 
  AlertCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { getAdminIncidentDetail, updateAdminIncident } from '../services/api';
import { StatusBadge, DisasterPill } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

const DEPARTMENTS = [
  'Roads & Highway Maintenance',
  'Water Supply & Sewerage Board',
  'Municipal Solid Waste & Sanitation',
  'Electricity Distribution Company',
  'Public Works Department (PWD)',
  'Horticulture & Parks Department',
  'Traffic Police & Road Safety',
  'Disaster Management Authority',
  'General Municipal Administration'
];

export const IncidentDetailsPage = () => {
  const { incidentId } = useParams();
  const { isAdmin } = useAuth();
  
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Assignment & Update form
  const [assignedDept, setAssignedDept] = useState('');
  const [newUpdateNote, setNewUpdateNote] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('normal');

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const loadIncident = async () => {
    try {
      setLoading(true);
      const data = await getAdminIncidentDetail(incidentId);
      setIncident(data);
      if (data) {
        setAssignedDept(data.assigned_department || '');
        setSelectedPriority(data.priority || 'normal');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await updateAdminIncident(incidentId, { current_status: newStatus });
      setActionMsg(`Status updated to: ${newStatus.replace(/_/g, ' ')}`);
      await loadIncident();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      setUpdating(true);
      setSelectedPriority(newPriority);
      await updateAdminIncident(incidentId, { priority: newPriority });
      setActionMsg(`Priority updated to: ${newPriority}`);
      await loadIncident();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      alert('Error updating priority: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await updateAdminIncident(incidentId, { assigned_department: assignedDept });
      setActionMsg(`Assigned to: ${assignedDept}`);
      await loadIncident();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      alert('Error assigning department: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleAddProgressUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdateNote.trim()) return;

    try {
      setUpdating(true);
      const existingUpdates = incident.action_updates || [];
      const updatedList = [
        ...existingUpdates,
        {
          note: newUpdateNote.trim(),
          timestamp: new Date().toISOString(),
          status_at_time: incident.current_status
        }
      ];

      await updateAdminIncident(incidentId, { 
        summary: incident.summary,
        action_updates: updatedList
      });

      setNewUpdateNote('');
      setActionMsg('Progress update recorded.');
      await loadIncident();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      alert('Error saving update: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handlePublicationToggle = async () => {
    const nextPub = incident.publication_status === 'published' ? 'unpublished' : 'published';
    try {
      setUpdating(true);
      await updateAdminIncident(incidentId, { publication_status: nextPub });
      setActionMsg(`Publication visibility set to: ${nextPub}`);
      await loadIncident();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      alert('Error updating publication: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#94A3B8]">
        Loading incident details for {incidentId}...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto space-y-4 border border-rose-500/30">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#F8FAFC]">Incident Not Found</h2>
        <p className="text-xs text-[#94A3B8]">{error}</p>
        <Link
          to="/admin/incidents"
          className="btn-secondary text-xs inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>
      </div>
    );
  }

  const associatedReports = incident.associated_reports || [];
  const reportsCount = associatedReports.length || incident.report_count || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top back bar */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <Link
          to="/admin/incidents"
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#94A3B8]">{incident.incident_id}</span>
          <StatusBadge status={incident.current_status} />
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Incident Overview Panel */}
      <div className="card-elevated p-6 lg:p-8 space-y-5 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <DisasterPill type={incident.disaster_type} />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              incident.priority === 'urgent' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
              incident.priority === 'high' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
              'bg-blue-500/15 text-blue-300 border-blue-500/30'
            }`}>
              Priority: {incident.priority?.toUpperCase() || 'NORMAL'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              incident.publication_status === 'published' 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-white/5 text-[#94A3B8] border-white/10'
            }`}>
              {incident.publication_status === 'published' ? 'Publicly Visible' : 'Internal Only'}
            </span>
          </div>

          {/* Workflow Status Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#94A3B8]">Status:</span>
              <select
                value={incident.current_status}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-[#0D1527] text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
              >
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#94A3B8]">Priority:</span>
              <select
                value={selectedPriority}
                disabled={updating}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-[#0D1527] text-[#F8FAFC] focus:outline-none focus:border-[#FF6B58]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {isAdmin && (
              <button
                type="button"
                disabled={updating}
                onClick={handlePublicationToggle}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  incident.publication_status === 'published'
                    ? 'border border-white/20 bg-white/5 text-[#F8FAFC] hover:bg-white/10'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                }`}
              >
                {incident.publication_status === 'published' ? 'Unpublish' : 'Publish Bulletin'}
              </button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] leading-tight">
            {incident.title}
          </h1>
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#94A3B8] mt-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-[#F8FAFC]">{incident.location}{incident.state ? `, ${incident.state}` : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#FF6B58]" />
              <span className="font-mono">{reportsCount} citizen {reportsCount === 1 ? 'report' : 'reports'} grouped</span>
            </div>
            {incident.latitude && incident.longitude && (
              <div className="font-mono text-[#94A3B8]">
                Coords: {Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#0D1527] border border-white/10 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold block">Issue Description</span>
            <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">{incident.summary || 'No summary provided.'}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0D1527] border border-white/10 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold block">Public Facing Notice</span>
            <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">{incident.public_summary || incident.summary || 'Visible when published.'}</p>
          </div>
        </div>
      </div>

      {/* Assignment & Action Workflow row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Assignment & Progress Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Department Assignment Box */}
          <div className="card p-5 space-y-4 border border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Building className="w-4 h-4 text-[#FF6B58]" />
              <h2 className="text-sm font-semibold text-[#F8FAFC]">Department Assignment</h2>
            </div>

            <form onSubmit={handleAssignDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Responsible Civic Authority
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary text-xs py-1.5"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>

          {/* Record Action Update */}
          <div className="card p-5 space-y-4 border border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-[#F8FAFC]">Record Progress Update</h2>
            </div>

            <form onSubmit={handleAddProgressUpdate} className="space-y-3">
              <textarea
                rows={2}
                value={newUpdateNote}
                onChange={(e) => setNewUpdateNote(e.target.value)}
                placeholder="Log actions taken, contractor dispatched, or resolution notes..."
                className="form-input text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating || !newUpdateNote.trim()}
                  className="btn-primary text-xs py-1.5"
                >
                  Add Progress Note
                </button>
              </div>
            </form>

            {/* Action Updates Timeline */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold block mb-2">
                Action History
              </span>

              {incident.action_updates && incident.action_updates.length > 0 ? (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {incident.action_updates.map((update, idx) => (
                    <div key={idx} className="p-3 bg-[#0D1527] rounded-xl border border-white/10 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>{new Date(update.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {update.status_at_time && <span className="font-medium text-[#FF6B58] capitalize">{update.status_at_time.replace(/_/g, ' ')}</span>}
                      </div>
                      <p className="text-[#CBD5E1] leading-snug">{update.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8] py-3 text-center">No action updates recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Associated Citizen Reports (7 cols) - CLICKABLE TO OPEN DETAILS */}
        <div className="lg:col-span-7 card p-5 space-y-4 border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF6B58]" />
              <h2 className="text-sm font-semibold text-[#F8FAFC]">
                Associated Citizen Reports ({reportsCount})
              </h2>
            </div>
            <span className="text-xs text-[#94A3B8]">Click any report to view details</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {associatedReports.length > 0 ? (
              associatedReports.map((rep) => (
                <Link
                  key={rep.report_id}
                  to={`/admin/reports/${rep.report_id}`}
                  className="p-4 rounded-xl bg-[#0D1527] border border-white/10 hover:border-white/30 transition-all space-y-2 text-xs block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#FF6B58] group-hover:underline">
                      {rep.report_id}
                    </span>
                    <span className="text-[#94A3B8] text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rep.created_at || rep.reported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <p className="text-xs text-[#CBD5E1] leading-relaxed italic bg-white/5 p-3 rounded-lg border border-white/5 group-hover:text-[#F8FAFC]">
                    "{rep.original_text}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#94A3B8]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{rep.raw_location || rep.city || 'Location logged'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {rep.latitude && rep.longitude && (
                        <span className="font-mono text-[#94A3B8]">
                          {Number(rep.latitude).toFixed(4)}, {Number(rep.longitude).toFixed(4)}
                        </span>
                      )}
                      <span className="text-[#FF6B58] font-semibold flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        Inspect Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#94A3B8]">
                1 report directly associated with this incident.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
