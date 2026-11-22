import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus,
  Compass,
  Search,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Droplets,
  Trash2,
  Lightbulb,
  Building2,
  Leaf,
  Flame,
  HelpCircle,
  FileText,
  Layers,
  TrendingUp,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { getPublicIncidents } from '../../services/api';
import { StatusBadge, DisasterPill } from '../../components/StatusBadge';

const CATEGORIES = [
  {
    key: 'pothole',
    icon: Zap,
    label: 'Roads & Potholes',
    desc: 'Damaged roads, potholes, broken footpaths, road obstructions',
    accentColor: 'text-amber-400',
    borderColor: 'hover:border-amber-500/40',
    badgeBg: 'bg-amber-500/10'
  },
  {
    key: 'waterlogging',
    icon: Droplets,
    label: 'Water & Drainage',
    desc: 'Waterlogging, drain blockage, pipeline leaks, water supply issues',
    accentColor: 'text-blue-400',
    borderColor: 'hover:border-blue-500/40',
    badgeBg: 'bg-blue-500/10'
  },
  {
    key: 'garbage_accumulation',
    icon: Trash2,
    label: 'Garbage & Sanitation',
    desc: 'Garbage piles, overflowing bins, open dumping, public sanitation',
    accentColor: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10'
  },
  {
    key: 'streetlight_failure',
    icon: Lightbulb,
    label: 'Electricity & Lights',
    desc: 'Streetlight outages, dark roads, damaged electrical poles',
    accentColor: 'text-yellow-400',
    borderColor: 'hover:border-yellow-500/40',
    badgeBg: 'bg-yellow-500/10'
  },
  {
    key: 'damaged_public_building',
    icon: Building2,
    label: 'Public Infrastructure',
    desc: 'Damaged public buildings, broken facilities, unsafe railings',
    accentColor: 'text-purple-400',
    borderColor: 'hover:border-purple-500/40',
    badgeBg: 'bg-purple-500/10'
  },
  {
    key: 'fallen_tree',
    icon: Leaf,
    label: 'Environmental & Trees',
    desc: 'Fallen trees blocking pathways, pollution, hazardous branches',
    accentColor: 'text-teal-400',
    borderColor: 'hover:border-teal-500/40',
    badgeBg: 'bg-teal-500/10'
  },
  {
    key: 'flood',
    icon: Flame,
    label: 'Emergency & Hazards',
    desc: 'Severe flash floods, fire, collapsed structures — dial 112 first',
    accentColor: 'text-rose-400',
    borderColor: 'hover:border-rose-500/40',
    badgeBg: 'bg-rose-500/10'
  },
  {
    key: 'other',
    icon: HelpCircle,
    label: 'Other Civic Issues',
    desc: 'Any other civic or municipal problem requiring department action',
    accentColor: 'text-slate-400',
    borderColor: 'hover:border-slate-500/40',
    badgeBg: 'bg-slate-500/10'
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'You Spot a Problem',
    desc: 'A citizen notices a pothole, overflowing drain, dark streetlight, or public hazard in their neighborhood.',
  },
  {
    step: '02',
    title: 'Submit a Simple Report',
    desc: 'Describe the issue, mark the location on an interactive map, and attach photos. You get an instant Reference ID.',
  },
  {
    step: '03',
    title: 'Duplicate Grouping',
    desc: 'Multiple reports about the same issue are organized into a single incident to give authorities a complete picture.',
  },
  {
    step: '04',
    title: 'Department Assigned',
    desc: 'The incident is assigned directly to the responsible authority (Roads, Water Board, Electricity, Sanitation).',
  },
  {
    step: '05',
    title: 'Action & Progress Logged',
    desc: 'Field teams log progress updates into the incident timeline as inspections and repairs proceed.',
  },
  {
    step: '06',
    title: 'Verified Resolution',
    desc: 'Once work is inspected and fixed, the incident is closed. Citizens can track the outcome anytime.',
  },
];

export const PublicLandingPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublicIncidents();
        setIncidents(data.slice(0, 6));
        setStats({
          total: data.length,
          resolved: data.filter(i => i.current_status === 'resolved').length,
          active: data.filter(i => ['active', 'in_progress', 'monitoring', 'under_review'].includes(i.current_status)).length,
        });
      } catch (err) {
        console.error('Failed to load incidents:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in space-y-12">
      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-8 sm:p-12 lg:p-16 border border-white/10 fluted-glass-pattern">
        {/* Ambient atmospheric glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#FF6B58]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Bringing Community Concerns into Focus.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F8FAFC] leading-tight">
            Your city. Your voice. <br />
            <span className="text-[#FF6B58]">Report what needs attention.</span> See the change happen.
          </h1>

         <div className="space-y-4">
  <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-2xl">
    Everyday civic problems affect how we live, travel, and experience our neighbourhoods. Yet, a pothole, overflowing drain, garbage pile, or broken streetlight can go unnoticed when complaints are scattered and updates are hard to follow.
  </p>

  <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-2xl">
    ResQIntel gives these concerns a clear path. Report an issue, help bring similar complaints together, follow its progress, and see what action has been taken. Because improving a neighbourhood starts with making its problems visible.
  </p>
</div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/report"
              className="btn-primary text-sm shadow-lg shadow-[#FF6B58]/20"
            >
              <FilePlus className="w-4 h-4" />
              Report a Problem
            </Link>
            <Link
              to="/explore"
              className="btn-secondary text-sm"
            >
              <Compass className="w-4 h-4 text-blue-400" />
              Browse Active Issues
            </Link>
            <Link
              to="/track"
              className="btn-secondary text-sm text-[#CBD5E1] hover:text-[#F8FAFC]"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              Track My Report
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS BAR ───────────────────────────────── */}
      <section className="glass-panel rounded-xl p-5 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          <div className="flex items-center justify-center gap-4 py-2 sm:py-0">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">{stats.total}</div>
              <div className="text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Citizen Reports Logged</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-2 sm:py-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">{stats.active}</div>
              <div className="text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Under Active Response</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-2 sm:py-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">{stats.resolved}</div>
              <div className="text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Issues Resolved</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ISSUE CATEGORIES ─────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">Categories</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5">What Needs Attention in Your Neighbourhood?</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              Select a category to start your report. Every civic observation is logged, verified, and mapped.
            </p>
          </div>
          <Link
            to="/report"
            className="text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold flex items-center gap-1 shrink-0"
          >
            Submit an Issue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                to={`/report?category=${cat.key}`}
                className={`card p-5 border border-white/10 ${cat.borderColor} hover:bg-[#1B2A4A] transition-all flex flex-col justify-between group`}
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-lg ${cat.badgeBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${cat.accentColor} transition-transform group-hover:scale-110`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#F8FAFC] group-hover:text-[#FF6B58] transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#94A3B8] group-hover:text-[#F8FAFC]">
                  <span>Report this</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── RECENT INCIDENTS BULLETIN ────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">Live Bulletin</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-0.5">Recently Reported Incidents</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              Verified civic incidents published for public awareness and monitoring.
            </p>
          </div>
          <Link
            to="/explore"
            className="text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold flex items-center gap-1"
          >
            View all incidents <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="card py-16 text-center text-[#94A3B8] text-xs">
            Loading recent incidents bulletin…
          </div>
        ) : incidents.length === 0 ? (
          <div className="card py-16 text-center text-[#94A3B8] text-xs space-y-2">
            <p>No published incidents at this moment.</p>
            <Link to="/report" className="text-[#FF6B58] hover:underline font-medium">Be the first to report an issue</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {incidents.map((inc) => (
              <div
                key={inc.incident_id}
                className="card-elevated p-5 flex flex-col justify-between hover:border-white/25 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <DisasterPill type={inc.disaster_type} />
                    <StatusBadge status={inc.current_status} />
                  </div>

                  <h3 className="font-semibold text-[#F8FAFC] text-sm leading-snug line-clamp-2 group-hover:text-[#FF6B58] transition-colors">
                    {inc.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{inc.location}{inc.state ? `, ${inc.state}` : ''}</span>
                  </div>

                  <p className="text-xs text-[#CBD5E1] line-clamp-2 leading-relaxed">
                    {inc.public_summary || inc.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inc.updated_at || inc.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <Link
                    to={`/incident/${inc.incident_id}`}
                    className="text-[#FF6B58] hover:text-[#FF8575] font-semibold flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="glass-panel rounded-2xl p-8 sm:p-12 border border-white/10 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">
            Operational Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            How ResQIntel Works
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            From your citizen observation to verified resolution — a transparent, accountable pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="card p-5 flex gap-4 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B58]/10 border border-[#FF6B58]/30 text-[#FF6B58] flex items-center justify-center font-bold text-sm shrink-0">
                {step.step}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-[#F8FAFC] text-sm">{step.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link
            to="/how-it-works"
            className="text-xs text-[#FF6B58] hover:text-[#FF8575] font-semibold inline-flex items-center gap-1"
          >
            Read the complete operational walkthrough <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── EMERGENCY NOTICE ─────────────────────────────── */}
      <section className="p-5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-red-200">
            🚨 Immediate Life-Threatening Emergencies: Call 112
          </p>
          <p className="text-red-300/80 leading-relaxed">
            ResQIntel records civic issues and facilitates municipal department resolution. It does <strong>not</strong> dispatch
            police, fire, or ambulance rescue teams. If lives are currently endangered, dial <strong>112</strong> immediately.
          </p>
        </div>
      </section>
    </div>
  );
};
