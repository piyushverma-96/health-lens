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
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* ================= TOP GREETING & STATUS BANNER ================= */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
            <span>Good day, {firstName}</span>
            <span className="text-lg sm:text-xl shrink-0">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
            Here's your health overview. Stay consistent, stay ahead.
          </p>
        </div>

        {/* User Pill Badge matching reference design top-right */}
        <div 
          onClick={() => onNavigate("profile")}
          className="shrink-0 flex items-center gap-2 sm:gap-3 bg-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs hover:border-teal-600/40 transition-all cursor-pointer group"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
          </div>
          <div className="hidden sm:flex flex-col pr-1">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Overall Health */}
        <div className="panel-card p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 sm:space-y-2 hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Overall Health</span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HeartPulse className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-base sm:text-xl font-heading font-bold text-slate-900">
              {totalBiomarkers > 0 ? (abnormalBiomarkers.length === 0 ? "Optimal" : "Attention") : "Ready"}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium truncate">
              {totalBiomarkers > 0 ? `${normalBiomarkers.length} of ${totalBiomarkers} in target` : "Upload a report to start"}
            </p>
          </div>
        </div>

        {/* Card 2: Latest Report */}
        <div 
          onClick={() => latestReport && onNavigate("history", latestReport.id)}
          className="panel-card p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 sm:space-y-2 hover:border-teal-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Latest Report</span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-base sm:text-xl font-heading font-bold text-slate-900 truncate" title={latestReport?.file_name || "No scans yet"}>
              {latestReport?.file_name ? latestReport.file_name.replace(/\.[^/.]+$/, "") : "No reports yet"}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
              {latestReport?.recorded_at || "Awaiting scan"}
            </p>
          </div>
        </div>

        {/* Card 3: Key Biomarkers Status */}
        <div 
          onClick={() => onNavigate("trends")}
          className="panel-card p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 sm:space-y-2 hover:border-teal-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Key Biomarkers</span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-base sm:text-xl font-heading font-bold text-slate-900">
              {abnormalBiomarkers.length > 0 ? (
                <span className="text-rose-600">{abnormalBiomarkers.length} Abnormal</span>
              ) : (
                <span className="text-slate-900">{totalBiomarkers} Tracked</span>
              )}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              {abnormalBiomarkers.length > 0 ? "Requires review" : "All optimal"}
            </p>
          </div>
        </div>

        {/* Card 4: AI Insights */}
        <div 
          onClick={() => onNavigate("chat")}
          className="panel-card p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 sm:space-y-2 hover:border-teal-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">AI Insights</span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-base sm:text-xl font-heading font-bold text-slate-900 truncate">
              {completedReports.length > 0 ? `${completedReports.length} Analysis Ready` : "Awaiting scan"}
            </p>
            <p className="text-[10px] sm:text-[11px] text-teal-600 font-medium flex items-center gap-1">
              <span>Ask assistant</span>
              <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </div>

      </div>

      {/* ================= ROW 1: HEALTH STATUS + AI HEALTH INSIGHT (SIDE BY SIDE ON MOBILE) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-6 items-stretch">
        
        {/* SECTION A: Health Status & Circular Gauge Ring */}
        <div className="col-span-1 lg:col-span-4 panel-card p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Health Status
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-teal-700 font-mono bg-teal-50 px-1.5 py-0.5 rounded-md">
              {scoreLabel}
            </span>
          </div>

          {/* SVG Circular Progress Ring */}
          <div className="my-2 sm:my-5 relative flex items-center justify-center">
            {healthScore !== null ? (
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center">
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
                  <span className="text-xl sm:text-3xl font-heading font-bold text-slate-900 leading-none">
                    {healthScore}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5">/100</span>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-2 text-center">
                <UploadCloud className="h-5 w-5 sm:h-7 sm:w-7 text-slate-300 mb-0.5" />
                <span className="text-[8.5px] sm:text-[10px] text-slate-400 font-medium leading-tight">
                  No score
                </span>
              </div>
            )}
          </div>

          <div className="w-full pt-2 sm:pt-3 border-t border-slate-100">
            {totalBiomarkers > 0 ? (
              <div className="flex items-center justify-center sm:justify-between text-[10px] sm:text-xs text-slate-600">
                <span className="flex items-center gap-1 text-teal-700 font-semibold truncate">
                  <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="truncate">Optimal Track</span>
                </span>
                <span className="hidden sm:inline text-slate-400 font-mono">
                  {totalBiomarkers} markers
                </span>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("upload")}
                className="w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] sm:text-xs font-bold rounded-lg transition-all"
              >
                Upload Lab
              </button>
            )}
          </div>
        </div>

        {/* SECTION E: Intelligent AI Insight Panel */}
        <div className="col-span-1 lg:col-span-8 panel-card p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-white via-white to-teal-50/40">
          <div className="space-y-1.5 sm:space-y-3">
            <div className="flex items-center justify-between pb-1.5 sm:pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-teal-700">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">AI Health Insight</h3>
              </div>
              <span className="hidden sm:inline text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                Clinical Context
              </span>
            </div>

            {latestReport?.summary ? (
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-[11px] sm:text-xs text-slate-700 leading-snug sm:leading-relaxed font-medium line-clamp-3 sm:line-clamp-4">
                  {latestReport.summary}
                </p>
                {latestReport.biomarkers && latestReport.biomarkers.some(b => b.status === "high") && (
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-50 border border-rose-200/70 text-[10px] sm:text-[11px] text-rose-800 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">Elevated metabolic indicators found. Review with doctor.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 sm:py-6 text-center space-y-1 text-slate-500">
                <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-teal-500/40 mx-auto" />
                <p className="text-[10px] sm:text-xs">Upload your lab test to activate automated clinical interpretations.</p>
              </div>
            )}
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (latestReport) {
                  onNavigate("history", latestReport.id);
                } else {
                  onNavigate("chat");
                }
              }}
              className="text-[10px] sm:text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Details</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => onNavigate("chat")}
              className="text-[10px] sm:text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Ask AI &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* ================= ROW 2: KEY BIOMARKERS (2x2 MICRO-GRID ON MOBILE) ================= */}
      <div className="panel-card p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600" />
            <span>Key Biomarkers</span>
          </h3>
          <button
            onClick={() => onNavigate("trends")}
            className="text-[10px] sm:text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
          >
            View all &rarr;
          </button>
        </div>

        {biomarkersLoading ? (
          <div className="py-6 flex justify-center items-center">
            <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />
          </div>
        ) : biomarkers && biomarkers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2.5">
            {biomarkers.slice(0, 4).map((b) => (
              <div 
                key={b.name} 
                onClick={() => onAskMore(b.name, b.value, b.unit)}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/80 hover:bg-teal-50/50 border border-slate-200/70 hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">{b.name}</p>
                  {getStatusBadge(b.status)}
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-900">{b.value}</span>
                  <span className="text-[9.5px] text-slate-400 font-mono truncate">{b.unit}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-400">
            No biomarkers logged yet. Upload a lab panel to extract metrics.
          </div>
        )}
      </div>

      {/* ================= ROW 3: LATEST SCAN + HEALTH STORY (SIDE BY SIDE ON MOBILE) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-6">
        
        {/* Latest Report Quick Card */}
        <div className="col-span-1 lg:col-span-6 panel-card p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1.5 sm:space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 sm:pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-900">
                <FileText className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold truncate">Latest Scan</h3>
              </div>
              {latestReport && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {latestReport.status}
                </span>
              )}
            </div>

            {latestReport ? (
              <div className="space-y-1">
                <h4 className="text-[11px] sm:text-sm font-bold text-slate-900 truncate">{latestReport.file_name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate">
                  <Calendar className="h-3 w-3 text-teal-600 shrink-0" />
                  <span>{latestReport.recorded_at}</span>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-[10px] text-slate-400">
                No reports yet.
              </div>
            )}
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-100 mt-2">
            {latestReport ? (
              <button
                onClick={() => onNavigate("history", latestReport.id)}
                className="w-full py-1.5 sm:py-2 px-2 bg-slate-900 hover:bg-slate-950 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <span>View Report</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate("upload")}
                className="w-full py-1.5 sm:py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <UploadCloud className="h-3 w-3" />
                <span>Upload</span>
              </button>
            )}
          </div>
        </div>

        {/* Health Story ("What Changed?") */}
        <div className="col-span-1 lg:col-span-6 panel-card p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1.5 sm:space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 sm:pb-3 border-b border-slate-100">
              <span className="text-[9.5px] sm:text-[10.5px] font-mono uppercase tracking-wider text-teal-700 font-bold truncate">
                Health Story
              </span>
              <button
                onClick={() => onNavigate("trends")}
                className="text-[10px] font-bold text-teal-700 hover:underline shrink-0"
              >
                Trends &rarr;
              </button>
            </div>

            <div>
              {abnormalBiomarkers.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-rose-600">
                      {abnormalBiomarkers.length} Variances
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2">
                    {abnormalBiomarkers.slice(0, 2).map(b => b.name).join(", ")} flagged outside range.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 text-center py-1">
                  <p className="text-xs font-bold text-emerald-700">All Optimal</p>
                  <p className="text-[10px] text-slate-400 line-clamp-2">No abnormal flags recorded.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={() => onNavigate("trends")}
              className="w-full py-1.5 sm:py-2 px-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] sm:text-xs font-bold rounded-lg transition-all text-center"
            >
              Analyze Trends
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
