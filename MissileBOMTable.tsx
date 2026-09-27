import React, { useState } from 'react';
import { MISSILE_BOM } from '../../data/missileArchitectureData';
import {
  FileText,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Package,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

interface MissileBOMTableProps {
  onSelectRefDes?: (refDes: string) => void;
}

export const MissileBOMTable: React.FC<MissileBOMTableProps> = ({ onSelectRefDes }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SILICON' | 'STRUCTURAL'>('ALL');

  const filteredBOM = MISSILE_BOM.filter((item) => {
    const matchesSearch =
      item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.refDes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'SILICON') return item.refDes.startsWith('U');
    if (categoryFilter === 'STRUCTURAL') return !item.refDes.startsWith('U');
    return true;
  });

  const handleExportCSV = () => {
    soundFX.click();
    const headers = ['Item No', 'RefDes', 'Part Number', 'Component Name', 'Vendor', 'Qty', 'Package', 'Mass (g)', 'Mil-Std Compliance'];
    const rows = MISSILE_BOM.map((i) => [
      i.itemNo,
      i.refDes,
      i.partNumber,
      `"${i.name}"`,
      `"${i.vendor}"`,
      i.qty,
      `"${i.package}"`,
      i.massG,
      `"${i.milStd}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'AeroShield_155mm_Missile_Avionics_BOM.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMassKg = (MISSILE_BOM.reduce((sum, item) => sum + item.massG * item.qty, 0) / 1000).toFixed(2);

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-2xl font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-700/60 text-blue-400">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Engineering Bill of Materials (BOM) &amp; Hardware Matrix
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono font-bold">
                14 LINE ITEMS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified military specification components for 155mm Extended Range Guided Projectile (ERGM).
            </p>
          </div>
        </div>

        {/* Filter Pills & Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-950/90 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => {
                soundFX.click();
                setCategoryFilter('ALL');
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (14)
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setCategoryFilter('SILICON');
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                categoryFilter === 'SILICON'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Avionics ICs (10)
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setCategoryFilter('STRUCTURAL');
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                categoryFilter === 'STRUCTURAL'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hull &amp; Motors (4)
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-[#0e1424] border border-slate-800 rounded-xl px-3.5 py-2">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by part number, reference designator (U101), vendor, or qualification..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <th className="py-2.5 px-3">Item</th>
              <th className="py-2.5 px-3">RefDes</th>
              <th className="py-2.5 px-3">Part Number</th>
              <th className="py-2.5 px-3">Component Description</th>
              <th className="py-2.5 px-3">Vendor</th>
              <th className="py-2.5 px-3">Package</th>
              <th className="py-2.5 px-3 text-right">Mass (g)</th>
              <th className="py-2.5 px-3">Military Standard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {filteredBOM.map((item) => (
              <tr
                key={item.itemNo}
                onClick={() => {
                  if (item.refDes.startsWith('U') && onSelectRefDes) {
                    soundFX.click();
                    onSelectRefDes(item.refDes);
                  }
                }}
                className={`transition-colors ${
                  item.refDes.startsWith('U')
                    ? 'hover:bg-blue-600/10 cursor-pointer group'
                    : 'hover:bg-slate-900/40'
                }`}
              >
                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.itemNo}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                  <span className="group-hover:underline underline-offset-2">{item.refDes}</span>
                </td>
                <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">{item.partNumber}</td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">{item.name}</td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.vendor}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{item.package}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 tabular-nums">
                  {item.massG.toLocaleString()} g
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80">
                    {item.milStd}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Mass Breakdown */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div>
          <span>Total Projectile All-Up Mass: </span>
          <strong className="text-white font-mono">{totalMassKg} kg</strong>
          <span className="text-slate-500"> (Within 48.0 kg maximum 155mm NATO specification)</span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Click any IC row to jump directly to its pinout inspection dossier.
        </div>
      </div>
    </div>
  );
};
