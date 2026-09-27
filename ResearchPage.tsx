import React, { useState } from 'react';
import { RESEARCH_ITEMS, ClaimType } from '../data/mockResearch';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import {
  BookOpen,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';

export const ResearchPage: React.FC = () => {
  const [selectedClaimType, setSelectedClaimType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const claimTypes: ClaimType[] = [
    'VERIFIED FACT',
    'OFFICIAL REQUIREMENT',
    'PUBLIC REFERENCE',
    'SIMULATION RESULT',
    'ENGINEERING INFERENCE',
    'ASSUMPTION',
    'HYPOTHESIS',
    'FUTURE TARGET',
  ];

  const filteredItems = RESEARCH_ITEMS.filter((item) => {
    if (selectedClaimType !== 'ALL' && item.claimType !== selectedClaimType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.organization.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.relevance.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans max-w-[1640px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-semibold tracking-wider uppercase mb-1">
            <BookOpen size={14} />
            <span>18 · Research Papers &amp; Standards Matrix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Research &amp; Standards Evidence Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Aerospace defense standards, empirical citations, epistemological claim boundaries, and research references.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSourceBadge source="PUBLIC DEFENSE STANDARDS" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search standards, authors, citations..."
            className="w-full bg-[#070b14] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto flex-wrap">
          <Filter size={13} className="text-slate-400" />
          <span className="text-slate-400 mr-1">Classification:</span>
          <select
            value={selectedClaimType}
            onChange={(e) => setSelectedClaimType(e.target.value)}
            className="bg-[#070b14] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">ALL TYPES ({RESEARCH_ITEMS.length})</option>
            {claimTypes.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Research Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-3 font-sans text-xs"
          >
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                  {item.organization} · {item.year}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{item.title}</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#080d1a] border border-white/[0.08] text-slate-300 font-semibold shrink-0">
                {item.claimType}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">{item.summary}</p>

            <div className="p-3 rounded-sm bg-[#080d1a] border border-white/[0.04] space-y-1 font-mono text-[11px]">
              <span className="text-slate-400 font-bold block">Relevance to AeroShield:</span>
              <p className="text-slate-300 font-sans">{item.relevance}</p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate max-w-[280px]">Ref: {item.source}</span>
              <span className="text-[10px] text-cyan-400">CIT-VERIFIED</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
