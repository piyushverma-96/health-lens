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
import { Activity, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

export const BiomarkerTrends: React.FC = () => {
  const { useGetBiomarkerSummary, useGetBiomarkerHistory } = useBiomarkers();
  const { data: summary, isLoading: summaryLoading } = useGetBiomarkerSummary();
  
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>("");
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
    if (data.length < 2) return null;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const diff = last - first;
    const pct = ((diff / first) * 100).toFixed(1);
    
    if (diff > 0) {
      return {
        direction: "up",
        label: `Increased by ${pct}%`,
        color: "text-gold-leaf bg-gold-leaf/10 border border-gold-leaf/20",
        icon: TrendingUp
      };
    } else if (diff < 0) {
      return {
        direction: "down",
        label: `Decreased by ${Math.abs(parseFloat(pct))}%`,
        color: "text-gray-500 bg-gray-50 border border-gray-150",
        icon: TrendingDown
      };
    }
    return {
      direction: "stable",
      label: "Stable (no change)",
      color: "text-gray-400 bg-gold-light/40 border border-gold-border",
      icon: Activity
    };
  };

  if (summaryLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24">
        <Loader2 className="h-10 w-10 text-gold-leaf animate-spin mb-4" />
        <p className="text-sm text-gray-400 font-semibold font-heading uppercase tracking-widest">Loading biomarker analytics...</p>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-gold-border text-center shadow-md max-w-lg mx-auto mt-6">
        <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-heading font-bold text-clinical-slate mb-2">No Biomarkers Logged</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
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
    <div className="space-y-6 fade-in">
      {/* Top Filter Selection Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-border/60">
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Select Health Metric</h3>
          <p className="text-xs text-gray-500 mt-1">Plot historical measurements and track changes over time</p>
        </div>
        <select
          value={selectedBiomarker}
          onChange={(e) => setSelectedBiomarker(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-clinical-slate bg-white focus:outline-none focus:ring-1 focus:ring-gold-leaf cursor-pointer transition-colors hover:border-gold-leaf"
        >
          {summary.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name} ({b.unit})
            </option>
          ))}
        </select>
      </div>

      {/* Main Trend Card */}
      {selectedBiomarker && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart Frame - 9 cols */}
          <div className="lg:col-span-9 bg-white p-6 rounded-3xl border border-gold-border shadow-sm space-y-4 min-w-0">
            <div className="flex items-center justify-between border-b border-gold-border pb-4">
              <div>
                <h2 className="text-lg font-heading font-bold text-clinical-slate">{selectedBiomarker} Timeline</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">Normal Range: {activeBiomarker?.reference_range || "Not specified"}</p>
              </div>
              
              {/* Latest Value badge */}
              {activeBiomarker && (
                <div className="text-right">
                   <p className="text-2xl font-bold font-mono text-gold-leaf">{activeBiomarker.value}</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{activeBiomarker.unit} (Latest)</p>
                </div>
              )}
            </div>

            {/* Recharts Canvas */}
            {historyLoading ? (
              <div className="h-64 flex justify-center items-center">
                <Loader2 className="h-6 w-6 text-gold-leaf animate-spin" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="h-64 sm:h-80 w-full pt-4 min-w-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                      <XAxis 
                        dataKey="recorded_at" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 9, fill: "#9ca3af", fontFamily: "Geist Mono" }}
                        dy={10}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 9, fill: "#9ca3af", fontFamily: "Geist Mono" }} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "#FFFFFF", 
                          border: "1px solid #EFECE6", 
                          borderRadius: "16px", 
                          fontSize: "11px",
                          fontFamily: "Geist Mono",
                          color: "#4A5568"
                        }}
                      />
                      
                      {/* Shaded Reference Area indicating normal ranges */}
                      {bounds && (
                        <ReferenceArea 
                          y1={bounds.min} 
                          y2={bounds.max} 
                          fill="rgba(212, 175, 55, 0.05)" 
                          ifOverflow="extendDomain" 
                        />
                      )}

                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#D4AF37" 
                        strokeWidth={2.5} 
                        dot={{ r: 5, stroke: "#FFFFFF", strokeWidth: 2, fill: "#D4AF37" }}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                        name={selectedBiomarker}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                No historical records found for this biomarker.
              </div>
            )}
          </div>

          {/* Quick Metrics Insights - 3 cols, borderless and clean */}
          <div className="lg:col-span-3 space-y-6 pl-2">
            {/* Trend Summary Widget */}
            {trend && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Trend Direction</h4>
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl ${trend.color} shrink-0`}>
                    {TrendIcon && <TrendIcon className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-clinical-slate">{trend.label}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Over {history?.length} readings</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Context Card */}
            {activeBiomarker && (
              <div className="space-y-3 pt-4 border-t border-gold-border/60">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Reference Info</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold capitalize ${
                      activeBiomarker.status === "normal"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                        : activeBiomarker.status === "high"
                          ? "bg-red-50 text-red-700 border border-red-150"
                          : "bg-blue-50 text-blue-700 border border-blue-150"
                    }`}>
                      {activeBiomarker.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Range</span>
                    <span className="font-mono font-bold text-clinical-slate">{activeBiomarker.reference_range || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Recorded</span>
                    <span className="font-mono text-clinical-slate">{activeBiomarker.recorded_at}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Educational alert box */}
            <div className="border-l-2 border-gold-leaf/60 pl-4 space-y-2 pt-1">
              <div className="font-semibold text-gold-leaf flex items-center gap-1.5 font-heading text-xs">
                <Activity className="h-4 w-4" />
                About Shaded Area
              </div>
              <p className="leading-relaxed text-[11px] text-gray-500">
                The gold shaded region in the graph represents the standard normal bounds for this metric. Values outside this area will trigger status warning highlights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
