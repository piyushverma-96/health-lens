import React, { useState, useEffect } from "react";
import { useBiomarkers } from "../hooks/useBiomarkers";
import type { Biomarker } from "../hooks/useBiomarkers";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Sparkles
} from "lucide-react";

export const BiomarkerTrends: React.FC = () => {
  const { useGetBiomarkerSummary, useGetBiomarkerHistory } = useBiomarkers();
  const { data: summary, isLoading: summaryLoading } = useGetBiomarkerSummary();
  
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y">("6M");
  const { data: history, isLoading: historyLoading } = useGetBiomarkerHistory(
    selectedBiomarker || undefined
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select the first available biomarker name
  useEffect(() => {
    if (summary && summary.length > 0 && !selectedBiomarker) {
      setSelectedBiomarker(summary[0].name);
    }
  }, [summary, selectedBiomarker]);

  // Helper to parse reference range strings (e.g., "30-100" -> {min: 30, max: 100})
  const parseReferenceRange = (rangeStr: string | null) => {
    if (!rangeStr) return null;
    const clean = rangeStr.replace(/\s+/g, "").replace(/—|–/g, "-");
    
    try {
      const rangeMatch = clean.match(/^([\d\.]+)-([\d\.]+)$/);
      if (rangeMatch) {
        return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
      }
      const ltMatch = clean.match(/^<s?=?([\d\.]+)$/);
      if (ltMatch) {
        return { min: 0, max: parseFloat(ltMatch[1]) };
      }
      const gtMatch = clean.match(/^>s?=?([\d\.]+)$/);
      if (gtMatch) {
        return { min: parseFloat(gtMatch[1]), max: 9999 };
      }
    } catch (e) {
      console.warn("Failed to parse reference bounds:", rangeStr, e);
    }
    return null;
  };

  const getTrendAnalysis = (data: Biomarker[]) => {
    if (!data || data.length < 2) return null;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const diff = last - first;
    const pct = ((diff / first) * 100).toFixed(1);
    
    if (diff > 0) {
      return {
        direction: "up",
        label: `Increased by ${pct}%`,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        icon: TrendingUp
      };
    } else if (diff < 0) {
      return {
        direction: "down",
        label: `Decreased by ${Math.abs(parseFloat(pct))}%`,
        color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
        icon: TrendingDown
      };
    }
    return {
      direction: "stable",
      label: "Stable (no change)",
      color: "text-slate-400 bg-white/5 border-white/10",
      icon: Activity
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">High</span>;
      case "low":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">Low</span>;
      case "normal":
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">Normal</span>;
    }
  };

  if (summaryLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-3">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
          Loading biomarker analytics...
        </p>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="panel-card p-12 rounded-3xl border border-slate-200/80 text-center shadow-sm max-w-lg mx-auto mt-6 space-y-3">
        <Activity className="h-12 w-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Biomarkers Logged</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Once your uploaded clinical scans are successfully processed, your biomarker measurements will show up here as trend graphs.
        </p>
      </div>
    );
  }

  const activeBiomarker = summary.find(b => b.name === selectedBiomarker);
  const bounds = activeBiomarker ? parseReferenceRange(activeBiomarker.reference_range) : null;
  const trend = history ? getTrendAnalysis(history) : null;
  const TrendIcon = trend?.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ================= DARK CLINICAL TREND CARD (MATCHING REFERENCE UI BOTTOM-CENTER) ================= */}
      <div className="clinical-dark-card rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10 space-y-6 relative overflow-hidden">
        
        {/* Glowing Background Radial */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with Time Range Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <h2 className="text-xl font-heading font-bold text-white tracking-tight">Biomarker Trends</h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Track your key health indicators over time
            </p>
          </div>

          {/* Time Filters matching reference image: 3M | 6M | 1Y */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
            {(["3M", "6M", "1Y"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  timeRange === t 
                    ? "bg-teal-500 text-slate-950 shadow-xs" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector Pills matching reference design */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {summary.map((b) => {
            const isSelected = b.name === selectedBiomarker;
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => setSelectedBiomarker(b.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                    : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-slate-950" : "bg-teal-400"}`} />
                <span>{b.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Chart and Latest Values Split Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          
          {/* Recharts Canvas (8 cols) */}
          <div className="lg:col-span-8 p-4 rounded-2xl bg-white/[0.03] border border-white/10 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedBiomarker} Progression</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Ref Bounds: {activeBiomarker?.reference_range || "Established target interval"}
                </span>
              </div>

              {activeBiomarker && (
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-teal-300">{activeBiomarker.value}</span>
                  <span className="text-xs text-slate-400 ml-1 font-mono">{activeBiomarker.unit}</span>
                </div>
              )}
            </div>

            {historyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="h-64 sm:h-72 w-full min-w-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                      <XAxis 
                        dataKey="recorded_at" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "Geist Mono" }}
                        dy={8}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "Geist Mono" }} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "#0A1128", 
                          border: "1px solid rgba(255, 255, 255, 0.15)", 
                          borderRadius: "14px", 
                          fontSize: "11px",
                          fontFamily: "Geist Mono",
                          color: "#F8FAFC"
                        }}
                      />
                      {bounds && (
                        <ReferenceArea 
                          y1={bounds.min} 
                          y2={bounds.max} 
                          fill="rgba(13, 148, 136, 0.1)" 
                          ifOverflow="extendDomain" 
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#14B8A6" 
                        strokeWidth={3} 
                        dot={{ r: 5, stroke: "#0B132B", strokeWidth: 2, fill: "#14B8A6" }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: "#2DD4BF" }}
                        name={selectedBiomarker}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No historical readings recorded yet.
              </div>
            )}
          </div>

          {/* Right Panel: Latest Values matching reference design (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Latest Values
              </h4>
              <span className="text-[10px] text-teal-400 font-mono">Current Status</span>
            </div>

            <div className="space-y-3">
              {summary.slice(0, 5).map((b) => (
                <div 
                  key={b.name}
                  onClick={() => setSelectedBiomarker(b.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    b.name === selectedBiomarker
                      ? "bg-teal-500/10 border-teal-500/40"
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{b.name}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {b.value} {b.unit}
                    </p>
                  </div>
                  {getStatusBadge(b.status)}
                </div>
              ))}
            </div>

            {trend && (
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${trend.color}`}>
                {TrendIcon && <TrendIcon className="h-4 w-4 shrink-0" />}
                <span>{trend.label} across recorded tests</span>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Insight Narrative Strip matching reference design */}
        <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/30 flex items-start gap-3 relative z-10">
          <Sparkles className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="text-xs text-teal-100 leading-relaxed font-sans">
            <span className="font-bold text-teal-300">HealthLens Clinical Narrative:</span>{" "}
            {activeBiomarker 
              ? `Your ${activeBiomarker.name} is currently ${activeBiomarker.value} ${activeBiomarker.unit} (${activeBiomarker.status}). Reference intervals suggest maintaining regular clinical evaluation.`
              : "Track how your biological markers evolve to evaluate lifestyle interventions."}
          </p>
        </div>

      </div>

    </div>
  );
};
