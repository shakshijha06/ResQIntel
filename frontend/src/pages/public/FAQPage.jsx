import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, AlertCircle, PhoneCall, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ_SECTIONS = [
  {
    category: 'Reporting Civic Issues',
    items: [
      {
        q: 'What kinds of problems can I report on ResQIntel?',
        a: `You can report any local civic, municipal, or public utility problem in your area, including:
- Roads & Transportation: Potholes, broken roads, damaged footpaths, road obstructions, broken traffic signals.
- Water & Drainage: Waterlogging on roads, overflowing drains, blocked drainage channels, pipeline leaks, or drinking water supply disruptions.
- Garbage & Sanitation: Overflowing bins, irregular garbage collection, open dumping, and public toilet issues.
- Electricity & Streetlighting: Broken streetlights, dark road stretches, hanging electrical wires, or damaged power poles.
- Public Infrastructure: Damaged public facilities, broken railings, or structurally unsafe public structures.
- Environmental Hazards: Fallen trees blocking pathways, industrial air pollution, or water contamination.
- Emergencies & Disasters: Local flooding emergencies, fires, cyclones, or storms (always dial 112 first).`
      },
      {
        q: 'Can I submit a report anonymously?',
        a: `Yes. Name and phone/email are completely optional. You can submit an issue without providing any personal identity. If you do provide contact details, they are strictly kept confidential and only accessible to verified administrators who may need to clarify location details.`
      },
      {
        q: 'Can I upload photographs of the problem?',
        a: `Yes. In the report form, you can directly upload up to 3 photographs or video clips from your camera or device gallery (JPG, PNG, WebP, MP4 up to 5MB each). Visual evidence helps repair crews understand the exact equipment needed.`
      },
      {
        q: 'How do I specify the location if I don’t know coordinates?',
        a: `You can type a simple landmark, street, colony name, or village. Additionally, the form includes an interactive map where you can simply tap or click to drop a pin on the exact spot.`
      }
    ]
  },
  {
    category: 'Tracking & Resolution',
    items: [
      {
        q: 'How do I track the progress of my report?',
        a: `After submitting, you receive a reference ID (such as RSQ-8B291A or RPT-2026-0012). Simply visit the "Track My Report" page, enter your reference number, and you will see the latest review status, assigned department, and action updates.`
      },
      {
        q: 'What happens after I submit a report?',
        a: `1. Your submission is securely logged into the intake queue.
2. An administrator reviews the issue and checks whether other neighbors have already reported the same problem.
3. Similar reports in the same location are organized into a single incident to avoid duplicating municipal work.
4. The incident is assigned to the responsible department (e.g. Roads, Water Board, Sanitation).
5. Progress updates are logged as work is conducted.
6. Once completed and inspected, the incident is marked as resolved.`
      },
      {
        q: 'Why are multiple reports grouped together into one incident?',
        a: `When 10 citizens independently report the same flooded junction or deep pothole on MG Road, creating 10 separate jobs would confuse work crews. By linking them into one central incident, municipal teams get all photos, descriptions, and updates in one place, and all 10 citizens can see that their problem is being addressed.`
      },
      {
        q: 'How long does it take for a reported issue to be resolved?',
        a: `Resolution times depend on the severity and nature of the issue. Urgent safety hazards (fallen trees, damaged electrical poles) are typically escalated immediately, whereas road repaving or drainage overhaul may require scheduled contractor dispatch. You can follow live progress on the tracking page.`
      }
    ]
  },
  {
    category: 'Emergencies & Safety',
    items: [
      {
        q: 'Does submitting a report here dispatch an emergency rescue team or fire brigade?',
        a: `NO. ResQIntel is an issue-tracking and municipal incident management platform. It does NOT automatically dispatch police, ambulances, fire trucks, or disaster response forces.
In any life-threatening situation, active fire, medical emergency, or severe danger, immediately call 112 (National Emergency Helpline in India).`
      },
      {
        q: 'Is there any fee to report a problem or track progress?',
        a: `No. ResQIntel is completely free for citizens to use. It is a public service utility for community betterment.`
      }
    ]
  }
];

export const FAQPage = () => {
  const [openItems, setOpenItems] = useState({ '0-0': true, '1-0': true, '2-0': true });

  const toggle = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-[#FF6B58] uppercase tracking-wider">
          Help & Guidance
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto">
          Common questions about reporting local civic problems, tracking updates, and how issues are resolved.
        </p>
      </div>

      {/* Emergency alert banner */}
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-200">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <strong>Immediate Emergency?</strong> If someone is in danger, call <strong className="underline text-red-100">112</strong> right away. Do not wait for a web form response during life-threatening crises.
        </div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-8">
        {FAQ_SECTIONS.map((sec, secIdx) => (
          <div key={sec.category} className="space-y-3">
            <h2 className="text-sm uppercase tracking-wider font-bold text-[#FF6B58] pb-1 border-b border-white/10">
              {sec.category}
            </h2>
            <div className="space-y-2.5">
              {sec.items.map((item, itemIdx) => {
                const key = `${secIdx}-${itemIdx}`;
                const isOpen = openItems[key];
                return (
                  <div key={itemIdx} className="card-elevated overflow-hidden border border-white/10 transition-colors">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm font-semibold text-[#F8FAFC]">
                        {item.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#FF6B58] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed border-t border-white/5 bg-[#0D1527]/50 whitespace-pre-line font-sans">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl text-center space-y-3 border border-white/10">
        <h3 className="text-lg font-bold text-[#F8FAFC]">
          Ready to report a problem in your neighborhood?
        </h3>
        <p className="text-xs text-[#94A3B8]">
          Submit details and photos in a couple of minutes.
        </p>
        <div className="pt-2">
          <Link to="/report" className="btn-primary text-xs inline-flex items-center gap-1.5">
            <span>Report an Issue Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
