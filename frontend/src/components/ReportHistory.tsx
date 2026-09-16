import React, { useState } from "react";
import { useReports } from "../hooks/useReports";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { 
  FileText, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

interface ReportHistoryProps {
  onAskMore: (biomarkerName: string, value: number, unit: string) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({ onAskMore }) => {
  const { useGetReports, useGetReportDetails, useDeleteReport, useApproveReport, useRetryReport } = useReports();
  const { data: reports, isLoading: listLoading, error: listError } = useGetReports();
  
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { data: reportDetails, isLoading: detailsLoading } = useGetReportDetails(selectedReportId);
  const deleteMutation = useDeleteReport();
  const approveMutation = useApproveReport();
  const retryMutation = useRetryReport();
  const [approveLoading, setApproveLoading] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this report and all associated data?")) {
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
      alert("Report successfully added to your health timeline and RAG memory!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve report.");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryError(null);
    try {
      await retryMutation.mutateAsync(id);
      alert("Retry triggered! Re-processing report...");
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to trigger retry.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.detail) {
          msg = parsed.detail;
        }
      } catch {
        msg = err.message || msg;
      }
      setRetryError(msg);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-leaf/10 text-gold-leaf border border-gold-leaf/20 animate-pulse font-mono">
            <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin text-gold-leaf" />
            Analyzing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-150 font-mono">
            <CheckCircle className="h-2.5 w-2.5 mr-1 text-emerald-600" />
            Ready
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-150 font-mono">
            <XCircle className="h-2.5 w-2.5 mr-1 text-red-500" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (listLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24">
        <Loader2 className="h-10 w-10 text-gold-leaf animate-spin mb-4" />
        <p className="text-sm text-clinical-slate font-semibold uppercase tracking-widest font-heading">Retrieving your health reports...</p>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-heading font-bold text-red-800">Connection Failed</h3>
        <p className="text-xs text-red-600 mt-1">{(listError as any).message || "Could not fetch report records."}</p>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-gold-border text-center shadow-md max-w-lg mx-auto mt-6">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-heading font-bold text-clinical-slate mb-2">No Reports Found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          You haven't uploaded any medical reports yet. Upload your first blood panel or lab scan to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Reports List sidebar - 4 cols */}
      <div className={`lg:col-span-4 space-y-4 ${selectedReportId ? "hidden lg:block" : "block"}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Uploaded Scan Files</h3>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
                selectedReportId === report.id
                  ? "border-gold-leaf bg-gold-leaf/5 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-clinical-slate truncate" title={report.file_name}>
                    {report.file_name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-gold-leaf" />
                    <span>{report.recorded_at}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(report.status)}
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Viewport - 8 cols */}
      <div className={`lg:col-span-8 ${!selectedReportId ? "hidden lg:block" : "block"}`}>
        {selectedReportId ? (
          <div className="bg-white rounded-3xl border border-gold-border shadow-md p-6 lg:p-8 space-y-6 fade-in min-h-[50vh]">
            {/* Mobile Back button */}
            <button
              onClick={() => setSelectedReportId(null)}
              className="lg:hidden flex items-center text-xs font-semibold text-gold-leaf mb-4 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
            </button>

            {detailsLoading || !reportDetails ? (
              <div className="flex flex-col justify-center items-center py-24">
                <Loader2 className="h-8 w-8 text-gold-leaf animate-spin mb-4" />
                <p className="text-xs text-gray-400">Loading analysis data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-heading font-bold text-clinical-slate truncate">
                      {reportDetails.file_name}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1.5 font-mono flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gold-leaf" />
                      Test Date: {reportDetails.recorded_at}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(reportDetails.id, e)}
                    className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all text-xs font-semibold"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Report
                  </button>
                </div>

                {/* Status-specific panels */}
                {reportDetails.status === "pending" && (
                  <div className="text-center py-16 space-y-4">
                    <Loader2 className="h-12 w-12 text-gold-leaf animate-spin mx-auto opacity-75" />
                    <h3 className="text-base font-heading font-bold text-clinical-slate">Scanning Document...</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Our worker is executing optical character recognition (OCR) and calling the AI extractor. This takes about 5-10 seconds.
                    </p>
                  </div>
                )}

                {reportDetails.status === "failed" && (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-2xl space-y-3">
                    <div className="flex items-center text-red-700 font-semibold gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      Extraction Failed
                    </div>
                    <p className="text-xs text-red-600">
                      {reportDetails.error_message || "An unknown error occurred during OCR text parsing."}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Please try uploading a clearer image file or a native digital PDF report.
                    </p>
                    {retryError && (
                      <p className="text-xs text-red-600 font-semibold bg-red-100/50 p-2.5 rounded-xl border border-red-250">
                        {retryError}
                      </p>
                    )}
                    <button
                      onClick={() => handleRetry(reportDetails.id)}
                      disabled={retryMutation.isPending}
                      className="mt-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {retryMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Retry Extraction
                    </button>
                  </div>
                )}

                {reportDetails.status === "completed" && (
                  <div className="space-y-6">
                    {/* Name Mismatch Warning and Approval Actions */}
                    {reportDetails.is_mismatched && !reportDetails.approved_for_history && (
                      <div className="bg-red-50/50 border border-red-200 p-5 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-sm text-red-800">Name Mismatch Verification Required</span>
                            <p className="text-xs text-red-700 mt-1 leading-relaxed">
                              This report has been parsed for patient name <strong>{reportDetails.patient_name || "Unknown"}</strong>, which does not match your profile name.
                              To keep your health metrics, timeline charts, and chatbot conversation memory clean and personal, these metrics are hidden from your global dashboards.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleApprove(reportDetails.id)}
                            disabled={approveLoading}
                            className="px-4 py-2 bg-gold-leaf hover:bg-gold-muted text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {approveLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                            Yes, Add to My Memory
                          </button>
                          <button
                            onClick={(e) => handleDelete(reportDetails.id, e)}
                            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
                          >
                            No, Ignore / Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Disclaimer box */}
                    <div className="border-l-2 border-gold-leaf/60 pl-4 flex items-start gap-3 my-4">
                      <AlertTriangle className="h-4 w-4 text-gold-leaf shrink-0 mt-0.5" />
                      <div className="text-[11px] text-gray-505 leading-relaxed">
                        <span className="font-bold text-clinical-slate mr-1.5">Educational Insight Disclaimer:</span>
                        This is educational information and not a medical diagnosis. Please consult with a physician to evaluate these laboratory numbers.
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Clinical Overview</h4>
                      <p className="text-[13px] leading-relaxed text-clinical-slate font-medium pl-1">
                        {reportDetails.summary || "No summary available."}
                      </p>
                    </div>

                    {/* Extracted Biomarkers Table */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold px-1">Cataloged Biomarkers</h4>
                      
                      {reportDetails.biomarkers && reportDetails.biomarkers.length > 0 ? (
                        <div className="overflow-hidden bg-transparent">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gold-border text-left text-xs">
                              <thead className="bg-[#FAF9F6] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-3.5">Biomarker</th>
                                  <th className="px-6 py-3.5">Value</th>
                                  <th className="px-6 py-3.5">Reference Range</th>
                                  <th className="px-6 py-3.5 text-right">Insight</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gold-border">
                                {reportDetails.biomarkers.map((biomarker) => {
                                  let statusColor = "bg-gray-50 text-gray-600 border border-gray-150";
                                  if (biomarker.status === "normal") statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-150";
                                  if (biomarker.status === "high") statusColor = "bg-red-50 text-red-700 border border-red-150";
                                  if (biomarker.status === "low") statusColor = "bg-blue-50 text-blue-700 border border-blue-150";

                                  return (
                                    <tr key={biomarker.id} className="hover:bg-gold-light/20 transition-colors">
                                      <td className="px-6 py-4 font-semibold text-clinical-slate">
                                        {biomarker.name}
                                      </td>
                                      <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                        {biomarker.value} <span className="text-[10px] font-normal text-gray-400 font-sans">{biomarker.unit}</span>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-gray-400">
                                        {biomarker.reference_range || "N/A"}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2.5">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor}`}>
                                            {biomarker.status}
                                          </span>
                                          <button
                                            onClick={() => onAskMore(biomarker.name, biomarker.value, biomarker.unit)}
                                            className="text-[10px] text-gold-leaf hover:text-gold-muted font-bold flex items-center gap-0.5 hover:underline"
                                            title="Ask assistant about this metric"
                                          >
                                            Ask More <ChevronRight className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-gray-150 rounded-xl text-gray-400 text-xs">
                          No structured biomarkers were extracted.
                        </div>
                      )}
                    </div>

                    {/* AI Detailed Explanation */}
                    {reportDetails.explanation && (
                      <div className="space-y-2 border-t border-gray-100 pt-6">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Detailed Plain-English Insight</h4>
                        <div className="text-[13px] leading-relaxed text-clinical-slate pl-1">
                          <MarkdownRenderer content={reportDetails.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gold-border border-dashed p-16 text-center shadow-md flex flex-col justify-center items-center h-[50vh]">
            <FileText className="h-16 w-16 text-gray-300 mb-3" />
            <h3 className="text-base font-heading font-bold text-clinical-slate">No Report Selected</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-normal">
              Select an uploaded report scan on the left sidebar to view its clinical summary and extracted biomarkers list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
