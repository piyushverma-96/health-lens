import React, { useState, useEffect } from "react";
import { useReports } from "../hooks/useReports";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { 
  FileText,
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ArrowLeft,
  Search,
  Sparkles
} from "lucide-react";

interface ReportHistoryProps {
  initialSelectedReportId?: string | null;
  onAskMore: (biomarkerName: string, value: number, unit: string) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({ 
  initialSelectedReportId, 
  onAskMore 
}) => {
  const { useGetReports, useGetReportDetails, useDeleteReport, useApproveReport } = useReports();
  const { data: reports, isLoading: listLoading, error: listError } = useGetReports();
  
  const [selectedReportId, setSelectedReportId] = useState<string | null>(initialSelectedReportId || null);
  const { data: reportDetails, isLoading: detailsLoading } = useGetReportDetails(selectedReportId);
  
  const deleteMutation = useDeleteReport();
  const approveMutation = useApproveReport();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"summary" | "biomarkers" | "trends" | "insights">("summary");
  const [approveLoading, setApproveLoading] = useState(false);

  useEffect(() => {
    if (initialSelectedReportId) {
      setSelectedReportId(initialSelectedReportId);
    }
  }, [initialSelectedReportId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this report and all associated extracted biomarkers?")) {
      await deleteMutation.mutateAsync(id);
      if (selectedReportId === id) {
        setSelectedReportId(null);
      }
    }
  };

  const handleApprove = async (id: string) => {
    setApproveLoading(true);
    try {
      await approveMutation.mutateAsync(id);
      alert("Report successfully added to your personal health timeline and RAG memory!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve report.");
    } finally {
      setApproveLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 animate-pulse font-mono">
            <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin text-teal-600" />
            Analyzing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600" />
            Analyzed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 font-mono">
            <XCircle className="h-2.5 w-2.5 mr-1 text-rose-600" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getBiomarkerStatusBadge = (status: string) => {
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

  // Filter reports
  const categories = ["All", "Blood Work", "Metabolic", "Vitamins", "Lipids"];
  const filteredReports = reports?.filter((r) => {
    const matchesSearch = r.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.recorded_at.includes(searchQuery);
    if (!matchesSearch) return false;
    if (activeCategory === "All") return true;
    if (activeCategory === "Blood Work") return r.file_name.toLowerCase().includes("cbc") || r.file_name.toLowerCase().includes("blood");
    if (activeCategory === "Metabolic") return r.file_name.toLowerCase().includes("metabolic") || r.file_name.toLowerCase().includes("cmp");
    if (activeCategory === "Vitamins") return r.file_name.toLowerCase().includes("vitamin");
    if (activeCategory === "Lipids") return r.file_name.toLowerCase().includes("lipid") || r.file_name.toLowerCase().includes("cholesterol");
    return true;
  }) || [];

  if (listLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-3">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
          Retrieving health report records...
        </p>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="panel-card p-8 rounded-3xl border border-rose-200 bg-rose-50/50 text-center max-w-lg mx-auto">
        <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-900">Unable to Fetch Reports</h3>
        <p className="text-xs text-rose-700 mt-1">{(listError as any).message || "Could not retrieve records."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ================= IF A SPECIFIC REPORT IS SELECTED (REPORT ANALYSIS VIEW) ================= */}
      {selectedReportId ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Bar with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <button
              onClick={() => setSelectedReportId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Report Archive</span>
            </button>

            {reportDetails && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {getStatusBadge(reportDetails.status)}
                <button
                  onClick={(e) => handleDelete(reportDetails.id, e)}
                  className="px-3 py-1 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {detailsLoading || !reportDetails ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Loading structured intelligence...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Report Header Card matching reference design */}
              <div className="panel-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                        {reportDetails.mime_type.split("/")[1]?.toUpperCase() || "PDF"} Panel
                      </span>
                      <span className="text-xs text-slate-400 font-mono">HealthLab Diagnostic</span>
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                      {reportDetails.file_name.replace(/\.[^/.]+$/, "")}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      Recorded Test Date: {reportDetails.recorded_at}
                    </p>
                  </div>

                  {/* Tab Navigation matching reference image: Summary | Biomarkers | Trends | AI Insights */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200 self-start sm:self-auto">
                    {[
                      { id: "summary", label: "Summary" },
                      { id: "biomarkers", label: "Biomarkers" },
                      { id: "trends", label: "Trends" },
                      { id: "insights", label: "AI Insights" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveAnalysisTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeAnalysisTab === tab.id
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Mismatch Warning if any */}
                {reportDetails.is_mismatched && !reportDetails.approved_for_history && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-bold">Patient Name Verification:</span> This report lists name{" "}
                        <strong>{reportDetails.patient_name || "Unknown"}</strong>. To protect your personalized trends, confirm before linking to memory.
                      </div>
                    </div>
                    <button
                      onClick={() => handleApprove(reportDetails.id)}
                      disabled={approveLoading}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {approveLoading ? "Linking..." : "Confirm & Link to My Memory"}
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: SUMMARY */}
              {activeAnalysisTab === "summary" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Clinical Overview */}
                  <div className="lg:col-span-8 panel-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Overall Summary</span>
                        {reportDetails.biomarkers?.some(b => b.status === "high" || b.status === "low") ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                            Needs Attention
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            All Optimal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-normal">
                        {reportDetails.summary || "No clinical summary was returned."}
                      </p>
                    </div>

                    {/* Key Biomarkers Quick Table */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Key Biomarkers In This Report</h4>
                      {reportDetails.biomarkers && reportDetails.biomarkers.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {reportDetails.biomarkers.map((b) => (
                            <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 block truncate">{b.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Ref: {b.reference_range || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-mono font-bold text-slate-900">{b.value} <span className="text-[10px] font-normal text-slate-400">{b.unit}</span></span>
                                {getBiomarkerStatusBadge(b.status)}
                                <button
                                  onClick={() => onAskMore(b.name, b.value, b.unit)}
                                  className="text-[11px] text-teal-700 font-bold hover:underline"
                                >
                                  Ask More
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-3">No individual biomarkers extracted.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Comparison Card & Prompt matching reference design */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Analysis Status</span>
                      
                      <div className="flex items-center justify-center p-4">
                        <div className="h-28 w-28 rounded-full bg-teal-50 border-4 border-teal-600/30 flex flex-col items-center justify-center text-center">
                          <CheckCircle2 className="h-7 w-7 text-teal-600 mb-1" />
                          <span className="text-xs font-bold text-slate-900">Verified</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Biomarkers parsed:</span>
                          <span className="font-mono font-bold text-slate-900">{reportDetails.biomarkers?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Anomalies flagged:</span>
                          <span className="font-mono font-bold text-rose-600">
                            {reportDetails.biomarkers?.filter(b => b.status === "high" || b.status === "low").length || 0}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onAskMore("Report Analysis", reportDetails.biomarkers?.length || 0, "parameters")}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Ask Assistant About Report &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BIOMARKERS TABLE */}
              {activeAnalysisTab === "biomarkers" && (
                <div className="panel-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Extracted Biomarker Roster</h3>
                    <span className="text-xs text-slate-400 font-mono">{reportDetails.biomarkers?.length || 0} Records</span>
                  </div>

                  {reportDetails.biomarkers && reportDetails.biomarkers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[10px]">
                            <th className="py-3 px-4">Biomarker</th>
                            <th className="py-3 px-4">Observed Value</th>
                            <th className="py-3 px-4">Standard Reference Interval</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportDetails.biomarkers.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">{b.name}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                {b.value} <span className="font-normal text-slate-400 text-[10px]">{b.unit}</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{b.reference_range || "N/A"}</td>
                              <td className="py-3.5 px-4">{getBiomarkerStatusBadge(b.status)}</td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => onAskMore(b.name, b.value, b.unit)}
                                  className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>Ask More</span>
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No biomarkers cataloged.</p>
                  )}
                </div>
              )}

              {/* TAB 3: TRENDS COMPARISON */}
              {activeAnalysisTab === "trends" && (
                <div className="panel-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Historical Movement Against Baseline</h3>
                    <p className="text-xs text-slate-500">Biomarker progression from preceding laboratory uploads.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {reportDetails.biomarkers && reportDetails.biomarkers.map((b) => (
                      <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">{b.name}</span>
                          {getBiomarkerStatusBadge(b.status)}
                        </div>
                        <p className="text-lg font-bold font-mono text-slate-900">
                          {b.value} <span className="text-xs font-normal text-slate-400">{b.unit}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Interval: {b.reference_range || "Target reference range"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AI DETAILED INSIGHTS */}
              {activeAnalysisTab === "insights" && (
                <div className="panel-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Detailed Plain-English Clinical Breakdown</h3>
                      <p className="text-xs text-slate-500">Generated by Groq medical LLM with educational boundaries.</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-teal-600" />
                  </div>

                  <div className="prose prose-sm max-w-none text-xs text-slate-700 leading-relaxed space-y-3 pt-2">
                    {reportDetails.explanation ? (
                      <MarkdownRenderer content={reportDetails.explanation} />
                    ) : (
                      <p className="text-slate-400">Detailed plain-language explanation not generated for this file.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      ) : (
        
        /* ================= ARCHIVE LIST VIEW (MATCHING REFERENCE UI BOTTOM-LEFT) ================= */
        <div className="space-y-5 animate-fade-in">
          
          {/* Header & Filter Row matching reference design */}
          <div className="panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-heading font-bold text-slate-900 tracking-tight">Report History</h2>
                <p className="text-xs text-slate-500">View and manage all your uploaded diagnostic lab reports.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports by name or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-[#FDFBF7]"
                />
              </div>
            </div>

            {/* Category Filter Pills: All | Blood Work | Metabolic | Vitamins | Lipids */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white shadow-xs font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table/Cards List */}
          <div className="space-y-3">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className="panel-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-teal-500/50 shadow-2xs transition-all flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                        {report.file_name.replace(/\.[^/.]+$/, "")}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-teal-600" />
                          {report.recorded_at}
                        </span>
                        <span>·</span>
                        <span>{report.mime_type.split("/")[1]?.toUpperCase() || "PDF"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(report.status)}
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReportId(report.id);
                      }}
                      className="px-4 py-1.5 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50 text-slate-700 hover:text-teal-700 text-xs font-bold transition-all"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(report.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-card p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
                <FileText className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Reports Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery ? "No uploaded reports match your search query." : "Upload your first blood test or metabolic panel scan to populate your timeline."}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
