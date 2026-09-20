import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useReports } from "../hooks/useReports";
import { useBiomarkers } from "../hooks/useBiomarkers";
import { 
  HeartPulse, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  Calendar,
  ChevronRight,
  UploadCloud,
  Loader2
} from "lucide-react";

interface HealthCommandCenterProps {
  onNavigate: (tabId: string, reportId?: string) => void;
  onAskMore: (name: string, value: number, unit: string) => void;
}

export const HealthCommandCenter: React.FC<HealthCommandCenterProps> = ({ 
  onNavigate,
  onAskMore
}) => {
  const { profile, user } = useAuth();
  const { useGetReports } = useReports();
  const { data: reports } = useGetReports();
  const { useGetBiomarkerSummary } = useBiomarkers();
  const { data: biomarkers, isLoading: biomarkersLoading } = useGetBiomarkerSummary();

  const firstName = profile?.first_name || user?.email?.split("@")[0] || "there";
  const fullName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}` 
    : user?.email || "User";

  // Compute real metrics from the database
  const completedReports = reports?.filter(r => r.status === "completed") || [];
  const latestReport = completedReports.length > 0 ? completedReports[0] : (reports && reports.length > 0 ? reports[0] : null);
  
  const totalBiomarkers = biomarkers?.length || 0;
  const abnormalBiomarkers = biomarkers?.filter(b => b.status === "high" || b.status === "low") || [];
  const normalBiomarkers = biomarkers?.filter(b => b.status === "normal") || [];

  // Meaningful Health Score calculated from real ratio of optimal vs total biomarkers
  // If no biomarkers, default to null so we don't display a fake score
  const healthScore = totalBiomarkers > 0 
    ? Math.min(100, Math.max(45, Math.round((normalBiomarkers.length / totalBiomarkers) * 100))) 
    : null;

  const scoreLabel = healthScore 
    ? healthScore >= 80 ? "Optimal" : healthScore >= 65 ? "Good" : "Needs Review"
    : "Analysis Ready";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">High</span>;
      case "low":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">Low</span>;
      case "normal":
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">Normal</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* ================= TOP GREETING & STATUS BANNER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Good morning, {firstName}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's your health overview. Stay consistent, stay ahead.
          </p>
        </div>

        {/* User Pill Badge matching reference design top-right */}
        <div 
          onClick={() => onNavigate("profile")}
          className="self-start sm:self-auto flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-teal-600/40 transition-all cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              {fullName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {profile?.gender ? `${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} · HealthLens Active` : "Patient Profile"}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4 TOP STAT CARDS (MATCHING REFERENCE UI) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Overall Health */}
        <div className="panel-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Overall Health</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HeartPulse className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-heading font-bold text-slate-900">
              {totalBiomarkers > 0 ? (abnormalBiomarkers.length === 0 ? "Optimal" : "Attention") : "Ready"}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              {totalBiomarkers > 0 ? `${normalBiomarkers.length} of ${totalBiomarkers} in target` : "Upload a report to start"}
            </p>
          </div>
        </div>

        {/* Card 2: Latest Report */}
        <div 
          onClick={() => latestReport && onNavigate("history", latestReport.id)}
          className="panel-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-teal-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Latest Report</span>
            <div className="h-7 w-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-heading font-bold text-slate-900 truncate" title={latestReport?.file_name || "No scans yet"}>
              {latestReport?.file_name ? latestReport.file_name.replace(/\.[^/.]+$/, "") : "No reports yet"}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              {latestReport?.recorded_at || "Awaiting scan"}
            </p>
          </div>
        </div>

        {/* Card 3: Key Biomarkers Status */}
        <div 
          onClick={() => onNavigate("trends")}
          className="panel-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-teal-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Key Biomarkers</span>
            <div className="h-7 w-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-heading font-bold text-slate-900">
              {abnormalBiomarkers.length > 0 ? (
                <span className="text-rose-600">{abnormalBiomarkers.length} Abnormal</span>
              ) : (
                <span className="text-slate-900">{totalBiomarkers} Tracked</span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              {abnormalBiomarkers.length > 0 ? "Requires review" : "All optimal"}
            </p>
          </div>
        </div>

        {/* Card 4: AI Insights */}
        <div 
          onClick={() => onNavigate("chat")}
          className="panel-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-teal-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">AI Insights</span>
            <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-heading font-bold text-slate-900">
              {completedReports.length > 0 ? `${completedReports.length} Analysis Ready` : "Awaiting scan"}
            </p>
            <p className="text-[11px] text-teal-600 font-medium flex items-center gap-1">
              <span>Ask assistant</span>
              <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </div>

      </div>

      {/* ================= MAIN TRI-COLUMN COMMAND ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* SECTION A: Health Status & Circular Gauge Ring (3 cols) */}
        <div className="lg:col-span-3 panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Health Status
            </span>
          </div>

          {/* SVG Circular Progress Ring */}
          <div className="my-6 relative flex items-center justify-center">
            {healthScore !== null ? (
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={healthScore >= 70 ? "#0D9488" : "#F59E0B"}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-heading font-bold text-slate-900 leading-none">
                    {healthScore}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">/100</span>
                  <span className="text-[10px] font-bold text-teal-700 font-mono mt-1">
                    {scoreLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center">
                <UploadCloud className="h-7 w-7 text-slate-300 mb-1" />
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  Upload scan to generate score
                </span>
              </div>
            )}
          </div>

          <div className="w-full pt-4 border-t border-slate-100">
            {totalBiomarkers > 0 ? (
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Trending Up
                </span>
                <span className="text-slate-400 font-mono">
                  {totalBiomarkers} markers
                </span>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("upload")}
                className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-all"
              >
                Upload First Report
              </button>
            )}
          </div>
        </div>

        {/* SECTION C: Key Biomarkers Table (5 cols) */}
        <div className="lg:col-span-5 panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                <span>Your Key Biomarkers</span>
              </h3>
              <button
                onClick={() => onNavigate("trends")}
                className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {biomarkersLoading ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                </div>
              ) : biomarkers && biomarkers.length > 0 ? (
                biomarkers.slice(0, 4).map((b) => (
                  <div key={b.name} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{b.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {b.reference_range || "Standard interval"}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900">{b.value}</span>
                        <span className="text-[10px] text-slate-400 ml-1 font-mono">{b.unit}</span>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No biomarkers logged yet. Upload a lab panel to extract metrics.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Last checked from active lab panels</span>
            <button 
              onClick={() => onNavigate("trends")}
              className="font-bold text-teal-700 hover:underline"
            >
              Analyze Trends
            </button>
          </div>
        </div>

        {/* SECTION E: Intelligent AI Insight Panel (4 cols) */}
        <div className="lg:col-span-4 panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white via-white to-teal-50/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-700">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-bold tracking-tight">AI Health Insight</h3>
              </div>
              <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                Clinical Context
              </span>
            </div>

            {latestReport?.summary ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-5">
                  {latestReport.summary}
                </p>
                {latestReport.biomarkers && latestReport.biomarkers.some(b => b.status === "high") && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/70 text-[11px] text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>HealthLens noticed elevated cardiovascular / metabolic indicators. Consult your clinician.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 text-xs text-slate-500">
                <Sparkles className="h-8 w-8 text-teal-500/40 mx-auto mb-2" />
                <p>HealthLens AI analyzes every uploaded document to provide plain-language takeaways.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (latestReport) {
                  onNavigate("history", latestReport.id);
                } else {
                  onNavigate("chat");
                }
              }}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onNavigate("chat")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Ask Questions
            </button>
          </div>
        </div>

      </div>

      {/* ================= SECTION B & D: HEALTH STORY & LATEST REPORT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION B: Health Story ("What Changed?") */}
        <div className="lg:col-span-7 panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 font-bold">Health Story</span>
              <h3 className="text-base font-heading font-bold text-slate-900">What Changed In Your Health?</h3>
            </div>
            <button
              onClick={() => onNavigate("trends")}
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Interactive Charts &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {abnormalBiomarkers.length > 0 ? (
              abnormalBiomarkers.map((b) => (
                <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{b.name}</span>
                      {getStatusBadge(b.status)}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standard Reference Target: <span className="font-mono text-slate-700">{b.reference_range || "Established bounds"}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {b.value} <span className="text-xs font-normal text-slate-400">{b.unit}</span>
                    </div>
                    <button
                      onClick={() => onAskMore(b.name, b.value, b.unit)}
                      className="text-[10px] font-bold text-teal-700 hover:underline mt-0.5 block"
                    >
                      Ask More
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-teal-600/40 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">No abnormal variances detected.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  As you upload more reports over time, HealthLens will compare progressive changes across panels.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION D: Latest Report Quick Card */}
        <div className="lg:col-span-5 panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h3 className="text-base font-heading font-bold text-slate-900">Latest Processed Scan</h3>
              </div>
              {latestReport && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {latestReport.status}
                </span>
              )}
            </div>

            {latestReport ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{latestReport.file_name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      {latestReport.recorded_at}
                    </span>
                    <span>·</span>
                    <span>{latestReport.mime_type.split("/")[1]?.toUpperCase() || "PDF"}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {latestReport.summary || "Structured extraction completed with full biomarker parameters cataloged."}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No reports uploaded yet.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            {latestReport ? (
              <button
                onClick={() => onNavigate("history", latestReport.id)}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Full Report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : null}

            <button
              onClick={() => onNavigate("upload")}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload Scan</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
