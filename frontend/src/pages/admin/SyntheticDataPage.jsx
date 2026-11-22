import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, Play, Trash2, CheckCircle2, 
  Layers, RefreshCw, FileText, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getSyntheticSummary, 
  generateSyntheticScenario, 
  resetSyntheticData 
} from '../../services/api';

export const SyntheticDataPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await getSyntheticSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load synthetic data summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleGenerate = async (scenarioType) => {
    try {
      setGenerating(true);
      setActionMessage(null);
      const res = await generateSyntheticScenario(scenarioType);
      setLastGenerated(res);
      setActionMessage(`Generated ${res.scenario_title} with ${res.reports_generated} reports.`);
      await loadSummary();
    } catch (err) {
      alert('Error generating scenario: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete ALL synthetic benchmark reports and reviews? Live citizen submissions will be preserved.")) return;
    try {
      setResetting(true);
      setActionMessage(null);
      const res = await resetSyntheticData();
      setActionMessage(res.message);
      setLastGenerated(null);
      await loadSummary();
    } catch (err) {
      alert('Error purging synthetic data: ' + (err.response?.data?.detail || err.message));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4EDE0]/10">
        <div>
          <h1 className="font-serif text-3xl text-[#F4EDE0] font-normal">Synthetic Benchmark Data Lab</h1>
          <p className="text-xs text-[#F4EDE0]/60 mt-1">
            Generate and evaluate controlled reconciliation scenarios without contaminating live emergency operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={resetting || summary?.synthetic_reports_count === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-300 border border-rose-500/20 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Synthetic Records</span>
          </button>
          <button
            onClick={loadSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 text-xs text-[#F4EDE0]/70 border border-[#F4EDE0]/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Safety & Integrity Callout */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Controlled Simulation Sandbox:</strong> Every synthetic report is explicitly stamped with <code>data_origin: "synthetic"</code>.
          Synthetic dispatches pass through identical extraction and multi-signal reconciliation steps, but are barred from public explorer listings.
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Live Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-[#F4EDE0]/10 space-y-1">
          <div className="text-[11px] text-[#F4EDE0]/50 uppercase tracking-wider font-mono">Synthetic Reports Active</div>
          <div className="text-3xl font-serif text-purple-300">{summary?.synthetic_reports_count ?? '—'}</div>
          <div className="text-[10px] text-[#F4EDE0]/40">Isolated simulation dispatches</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#F4EDE0]/10 space-y-1">
          <div className="text-[11px] text-[#F4EDE0]/50 uppercase tracking-wider font-mono">Simulation Reviews Active</div>
          <div className="text-3xl font-serif text-amber-300">{summary?.synthetic_reviews_count ?? '—'}</div>
          <div className="text-[10px] text-[#F4EDE0]/40">Candidate pairs in verification queue</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#F4EDE0]/10 space-y-1">
          <div className="text-[11px] text-[#F4EDE0]/50 uppercase tracking-wider font-mono">Reconciliation Review Link</div>
          <div className="pt-1">
            <Link
              to="/admin/reviews"
              className="text-xs text-[#FF6B58] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Inspect Review Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="text-[10px] text-[#F4EDE0]/40">Validate AI candidate decisions</div>
        </div>
      </section>

      {/* Benchmark Scenarios Catalog */}
      <section className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-5">
        <div>
          <h2 className="font-serif text-xl text-[#F4EDE0]">Run Benchmark Scenarios</h2>
          <p className="text-xs text-[#F4EDE0]/60 mt-0.5">
            Click any scenario to inject controlled dispatches and observe pipeline classification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: 'duplicate_pair',
              title: 'Exact Duplicate Flood Breach',
              category: 'Duplicate Detection',
              desc: 'Injects two collocated Majuli levee reports with identical coordinates and close timestamps to test exact duplicate classification.',
              color: 'border-blue-500/20 hover:border-blue-500/40'
            },
            {
              id: 'update_sequence',
              title: 'Urban Flood Progressive Timeline',
              category: 'Update Detection',
              desc: 'Injects an initial waterlogging alert followed by a 2.5ft deep stagnation update on ORR Bellandur to verify temporal update detection.',
              color: 'border-emerald-500/20 hover:border-emerald-500/40'
            },
            {
              id: 'conflict_pair',
              title: 'Contradictory Road Passability',
              category: 'Conflict Detection',
              desc: 'Injects two collocated reports on Digha Coastal Bypass claiming opposite conditions: "impassable washout" vs "intact and open".',
              color: 'border-rose-500/20 hover:border-rose-500/40'
            },
            {
              id: 'multilingual_trio',
              title: 'Multilingual Landslide Cluster',
              category: 'Multilingual Intelligence',
              desc: 'Injects three parallel dispatches in English, Hindi, and Bengali reporting the same Dharasu NH-108 rockfall.',
              color: 'border-purple-500/20 hover:border-purple-500/40'
            }
          ].map((sc) => (
            <div
              key={sc.id}
              className={`p-5 rounded-2xl bg-[#0D1527]/50 border ${sc.color} transition-all space-y-3 flex flex-col justify-between`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#F4EDE0]/40">
                  <span>{sc.category}</span>
                  <span className="text-[#FF6B58]">Ready</span>
                </div>
                <h3 className="font-serif text-base text-[#F4EDE0]">{sc.title}</h3>
                <p className="text-xs text-[#F4EDE0]/60 leading-relaxed font-light">{sc.desc}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleGenerate(sc.id)}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#F4EDE0]/10 hover:bg-[#FF6B58] text-[#F4EDE0] hover:text-[#14213D] text-xs font-semibold transition-all disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Generate Scenario</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
