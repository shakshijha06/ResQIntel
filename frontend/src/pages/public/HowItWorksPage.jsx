import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  MapPin, 
  Layers, 
  Building, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const HowItWorksPage = () => {
  const steps = [
    {
      num: '01',
      title: 'You Spot a Problem in Your Locality',
      subtitle: 'Citizen Observation',
      desc: 'Whether it is a deep pothole, an overflowing garbage bin, a waterlogged street, a broken streetlight, or a fallen tree — you notice an issue affecting your neighborhood.',
      icon: MapPin,
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      num: '02',
      title: 'Submit a Simple Report',
      subtitle: 'Quick & Transparent',
      desc: 'Fill out a short form detailing the problem, pin the approximate location on an interactive map, and optionally attach photos. You receive a unique reference ID to track progress.',
      icon: FileText,
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      num: '03',
      title: 'Reports Are Reviewed & Organized',
      subtitle: 'Duplicate & Incident Detection',
      desc: 'When multiple citizens report the same pothole or drainage issue, the platform organizes these reports under a single incident. This prevents duplicate dispatches and provides a complete picture.',
      icon: Layers,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      num: '04',
      title: 'Assignment to the Responsible Authority',
      subtitle: 'Actionable Routing',
      desc: 'Incidents are routed to the relevant municipal body or utility provider — such as the Roads Department, Water & Sewerage Board, or Municipal Sanitation Division.',
      icon: Building,
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      num: '05',
      title: 'Action Taken & Progress Logged',
      subtitle: 'Transparent Updates',
      desc: 'As work progresses (inspection scheduled, repair crew dispatched, temporary fix applied), updates are logged into the incident timeline so citizens know action is underway.',
      icon: Clock,
      badgeColor: 'text-coral bg-[#FF6B58]/10 border-[#FF6B58]/20'
    },
    {
      num: '06',
      title: 'Issue Resolved & Publicly Closed',
      subtitle: 'Accountable Resolution',
      desc: 'Once the problem is inspected and verified fixed, the incident is marked resolved. Citizens can check their tracking status and confirm that the issue in their locality has been addressed.',
      icon: CheckCircle2,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">
          Transparent Civic Governance
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC]">
          How ResQIntel Works
        </h1>
        <p className="text-xs sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          A clear, accountable bridge between citizens reporting civic problems and local authorities taking action to resolve them.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="card-elevated p-6 flex flex-col sm:flex-row items-start gap-5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border ${s.badgeColor}`}>
                {s.num}
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] uppercase tracking-wider text-[#FF6B58] font-semibold block">
                  {s.subtitle}
                </span>
                <h3 className="text-lg font-semibold text-[#F8FAFC]">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F8FAFC]">Have You Spotted a Public Issue in Your Area?</h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto">
          Help improve your community today by logging a quick civic report. Takes less than two minutes.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/report" className="btn-primary text-xs">
            Report a Problem Now
          </Link>
          <Link to="/explore" className="btn-secondary text-xs">
            Browse Active Incidents
          </Link>
        </div>
      </div>

      {/* Emergency notice */}
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong>Important Life Safety Notice:</strong> For immediate threats, major road cave-ins, sparking power lines, or active floods risking life, please dial <strong>112</strong> immediately. ResQIntel records municipal infrastructure issues and tracks department progress, but does not substitute emergency call services.
        </div>
      </div>
    </div>
  );
};
