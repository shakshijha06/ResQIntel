import React from 'react';
import { MapPin, Key, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { isTomTomConfigured, getMaskedApiKey } from '../services/tomtomService';

export const TomTomMapNotice = ({ compact = false, inline = false }) => {
  const configured = isTomTomConfigured();

  if (configured) {
    if (inline) {
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>TomTom Maps Active</span>
          <span className="font-mono text-[10px] text-slate-500">({getMaskedApiKey()})</span>
        </div>
      );
    }
    return null;
  }

  if (compact) {
    return (
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
        <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-amber-300">TomTom API Key Configuration</p>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Add your key to <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">frontend/.env.local</code> as{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">VITE_TOMTOM_API_KEY=your_key</code> to enable map tiles and location search.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-[#0D1527]/90 space-y-3 text-xs animate-fade-in">
      <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
        <Key className="w-4 h-4" />
        <span>TomTom Location Platform Setup</span>
      </div>
      <p className="text-slate-300 text-xs leading-relaxed">
        ResQIntel is integrated with <strong>TomTom Maps</strong> (Map Display, Places Search, and Reverse Geocoding APIs).
        To enable map display and address lookup:
      </p>
      <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-slate-200 space-y-1">
        <div className="text-slate-400 text-[10px]"># In frontend/.env.local (git-ignored):</div>
        <div className="text-emerald-400">VITE_TOMTOM_API_KEY=&lt;your_tomtom_api_key&gt;</div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Evaluation tier: 2,500 free transactions/day</span>
        <a
          href="https://developer.tomtom.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FF6B58] hover:underline inline-flex items-center gap-1"
        >
          <span>TomTom Developer Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
