import React from 'react';
import { Shield, Layers, Globe, Eye, CheckCircle2, Lock, FileText, Database } from 'lucide-react';
import { LogoMark } from '../../components/LogoMark';

export const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <LogoMark size={32} />
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F4EDE0]">About ResQIntel</h1>
        </div>
        <p className="text-sm text-[#F4EDE0]/70 leading-relaxed max-w-2xl">
          ResQIntel is a multilingual emergency information intelligence and reconciliation platform built to reduce crisis misinformation and organize scattered citizen observations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B58]/10 text-[#FF6B58] flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-base text-[#F4EDE0]">Multilingual Intake</h3>
          <p className="text-[#F4EDE0]/70 leading-relaxed">
            During major regional emergencies across India, crucial distress reports and infrastructure updates emerge in regional vernaculars including English, Hindi, and Bengali. ResQIntel accepts submissions across languages without forcing automated distortion of the original text.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-base text-[#F4EDE0]">Multi-Incident Distinction</h3>
          <p className="text-[#F4EDE0]/70 leading-relaxed">
            A disaster category like "Landslide" or "Flood" is a classification, not a single event. ResQIntel organizes reports into distinct real-world incidents separated by spatial coordinates, geography, and observation timelines.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-base text-[#F4EDE0]">Human-in-the-Loop Validation</h3>
          <p className="text-[#F4EDE0]/70 leading-relaxed">
            Artificial intelligence (powered by Google Gemini) assists by extracting structured location and severity details, but AI does NOT make final truth or publication decisions. Authorized operational analysts review conflicting statements before public bulletins are published.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-base text-[#F4EDE0]">Responsible Privacy Model</h3>
          <p className="text-[#F4EDE0]/70 leading-relaxed">
            Reporters receive secure hashed tracking tokens to check verification status without publicly exposing private personal details, phone numbers, or raw internal deliberations.
          </p>
        </div>
      </div>
    </div>
  );
};
