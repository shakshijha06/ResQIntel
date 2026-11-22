import React from 'react';

export const StatusBadge = ({ status, type = 'status' }) => {
  const getStyle = () => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
      case 'monitoring':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'resolved':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'published':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'pending':
      case 'unconfirmed':
      case 'needs review':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'closed':
      case 'archived':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
      case 'under_review':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'in_progress':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'provisional':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'verified':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'cross_referenced':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'partially_confirmed':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const formatText = (text) => {
    if (!text) return 'Unknown';
    return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {formatText(status)}
    </span>
  );
};

export const DisasterPill = ({ type }) => {
  const getCategoryStyle = (t) => {
    if (!t) return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    const lower = t.toLowerCase();

    // Civic categories
    if (lower.includes('pothole') || lower.includes('road')) 
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    if (lower.includes('garbage') || lower.includes('sanitation') || lower.includes('waste')) 
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (lower.includes('waterlog') || lower.includes('flood') || lower.includes('drainage')) 
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    if (lower.includes('electric') || lower.includes('streetlight') || lower.includes('power')) 
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    if (lower.includes('public_infrastructure') || lower.includes('infrastructure')) 
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    if (lower.includes('environment') || lower.includes('tree') || lower.includes('park')) 
      return 'bg-teal-500/15 text-teal-300 border-teal-500/30';

    // Emergency / disaster types → crimson
    if (
      lower.includes('emergency') ||
      lower.includes('fire') ||
      lower.includes('earthquake') ||
      lower.includes('cyclone') ||
      lower.includes('landslide')
    ) return 'bg-rose-500/20 text-rose-300 border-rose-500/35 shadow-[0_0_8px_rgba(244,63,94,0.2)]';

    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  const formatLabel = (t) => {
    if (!t) return 'General';
    return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getCategoryStyle(type)}`}>
      {formatLabel(type)}
    </span>
  );
};

export const CategoryPill = DisasterPill;
