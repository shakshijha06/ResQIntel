import React from 'react';
import { Search, Globe, Bell, User, Sparkles } from 'lucide-react';

export const Topbar = ({ searchQuery = '', setSearchQuery, currentLang = 'All', setLang }) => {
  return (
    <header className="h-16 border-b border-[#F4EDE0]/10 bg-[#14213D]/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[#F4EDE0]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports, incidents, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1527]/50 border border-[#F4EDE0]/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#F4EDE0] placeholder-[#F4EDE0]/40 focus:outline-none focus:border-[#FF6B58]/60 focus:ring-1 focus:ring-[#FF6B58]/40 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <div className="flex items-center space-x-1.5 bg-[#0D1527]/50 border border-[#F4EDE0]/10 rounded-xl px-2.5 py-1 text-xs text-[#F4EDE0]/80">
          <Globe className="w-3.5 h-3.5 text-[#FF6B58]" />
          <select
            value={currentLang}
            onChange={(e) => setLang && setLang(e.target.value)}
            className="bg-transparent border-none text-[#F4EDE0] text-xs focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#14213D] text-[#F4EDE0]">All Languages</option>
            <option value="en" className="bg-[#14213D] text-[#F4EDE0]">English (EN)</option>
            <option value="hi" className="bg-[#14213D] text-[#F4EDE0]">हिन्दी (HI)</option>
            <option value="bn" className="bg-[#14213D] text-[#F4EDE0]">বাংলা (BN)</option>
          </select>
        </div>

        {/* AI Integration Pill Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0D1527]/40 border border-[#F4EDE0]/10 text-[11px] text-[#F4EDE0]/60">
          <Sparkles className="w-3 h-3 text-[#FF6B58]" />
          <span>Gemini Core: Ready</span>
        </div>

        {/* Notification Bell */}
        <button 
          title="Incident alerts"
          className="relative p-2 rounded-xl text-[#F4EDE0]/60 hover:text-[#F4EDE0] hover:bg-[#F4EDE0]/5 transition-colors border border-transparent hover:border-[#F4EDE0]/10"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF6B58] rounded-full shadow-[0_0_6px_#FF6B58]"></span>
        </button>

        {/* User Profile Placeholder */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#F4EDE0]/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1B2A4A] to-[#FF6B58]/30 border border-[#F4EDE0]/20 flex items-center justify-center text-[#F4EDE0] text-xs font-serif font-bold">
            RQ
          </div>
          <span className="hidden lg:inline text-xs font-medium text-[#F4EDE0]/80">
            Emergency Desk
          </span>
        </div>
      </div>
    </header>
  );
};
