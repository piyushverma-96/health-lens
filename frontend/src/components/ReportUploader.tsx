import React, { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabase";
import { api } from "../services/api";
import { 
  UploadCloud, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Zap, 
  Sparkles,
  ShieldAlert,
  FileText,
  ArrowRight,
  Check
} from "lucide-react";

interface ReportUploaderProps {
  onUploadSuccess: () => void;
}

interface DemoReportInfo {
  id: string;
  title: string;
  category: string;
  date: string;
  fileName: string;
  fileUrl: string;
  highlights: string[];
  alertNotice?: string;
}

const DEMO_REPORTS: DemoReportInfo[] = [
  {
    id: "cmp",
    title: "Comprehensive Metabolic Panel (CMP)",
    category: "Liver & Renal Function",
    date: "2026-03-15",
    fileName: "Comprehensive_Metabolic_Panel_Demo.pdf",
    fileUrl: "/demo-reports/Comprehensive_Metabolic_Panel_Demo.pdf",
    highlights: ["Fasting Glucose 92 mg/dL", "Creatinine 0.9 mg/dL", "ALT 24 U/L", "BUN 14 mg/dL"],
  },
  {
    id: "cbc",
    title: "Complete Blood Count & Vitamins",
    category: "Hematology & Micronutrients",
    date: "2026-02-10",
    fileName: "Complete_Blood_Count_and_Vitamins_Demo.pdf",
    fileUrl: "/demo-reports/Complete_Blood_Count_and_Vitamins_Demo.pdf",
    highlights: ["Hemoglobin 14.2 g/dL", "Platelets 250 x10^3", "Vitamin D 19.5 ng/mL (Low)"],
    alertNotice: "Deficiency Alert: Vitamin D is sub-optimal (19.5 ng/mL)"
  },
  {
    id: "lipid",
    title: "Cardiovascular Lipid & Thyroid Profile",
    category: "Lipid Panel & Endocrine",
    date: "2026-03-05",
    fileName: "Cardiovascular_Lipid_and_Thyroid_Demo.pdf",
    fileUrl: "/demo-reports/Cardiovascular_Lipid_and_Thyroid_Demo.pdf",
    highlights: ["Total Cholesterol 215 mg/dL (High)", "LDL 138 mg/dL (High)", "HDL 48 mg/dL", "TSH 2.1"],
    alertNotice: "Elevated Alert: LDL is 138 mg/dL (Atherogenic Risk)"
  }
];

export const ReportUploader: React.FC<ReportUploaderProps> = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [recordedAt, setRecordedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const [uploading, setUploading] = useState(false);
  const [processingDemoId, setProcessingDemoId] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf"];
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

  const pipelineSteps = [
    { num: "01", title: "Uploading File", desc: "Encrypting and transmitting scan to private Supabase vault" },
    { num: "02", title: "Extracting Text (OCR)", desc: "Optical character recognition scanning test lines and units" },
    { num: "03", title: "Structuring Biomarkers", desc: "LLM parsing metrics, reference bounds, and numeric values" },
    { num: "04", title: "Generating Insights", desc: "Formulating plain-language summaries and risk comparisons" },
    { num: "05", title: "Saving Report", desc: "Indexing into personal health timeline and vector memory" }
  ];

  const validateSelectedFile = (selectedFile: File): { valid: boolean; error?: string } => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file format (.${ext || "unknown"}). Only PDF, PNG, or JPG files are accepted for medical reports.`
      };
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 15 MB.`
      };
    }
    return { valid: true };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const check = validateSelectedFile(droppedFile);
      if (!check.valid) {
        setError(check.error || "Only PNG, JPG, or PDF files are accepted.");
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const check = validateSelectedFile(selectedFile);
      if (!check.valid) {
        setError(check.error || "Only PNG, JPG, or PDF files are accepted.");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  // 1-Click Real Analysis for Synthetic Demo Reports
  const handleAnalyzeDemoReport = async (demo: DemoReportInfo) => {
    if (!user) {
      setError("Please sign in to analyze reports.");
      return;
    }

    setUploading(true);
    setProcessingDemoId(demo.id);
    setError(null);
    setSuccess(null);
    setPipelineStep(1);

    try {
      // Step 1: Uploading
      const response = await fetch(demo.fileUrl);
      if (!response.ok) {
        throw new Error(`Could not load sample PDF (${response.statusText}).`);
      }
      const blob = await response.blob();
      const demoFile = new File([blob], demo.fileName, { type: "application/pdf" });

      const uniqueId = crypto.randomUUID();
      const filePath = `${user.id}/${uniqueId}.pdf`;

      const { error: storageError } = await supabase.storage
        .from("reports")
        .upload(filePath, demoFile);

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // Step 2 & 3: Trigger OCR & Groq parsing
      setPipelineStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setPipelineStep(3);

      await api.post("/reports", {
        file_path: filePath,
        file_name: demo.fileName,
        mime_type: "application/pdf",
        recorded_at: demo.date
      });

      // Step 4 & 5: Insights & Saving
      setPipelineStep(4);
      await new Promise((r) => setTimeout(r, 700));
      setPipelineStep(5);
      await new Promise((r) => setTimeout(r, 600));

      setSuccess(`Report "${demo.title}" parsed successfully!`);
      setTimeout(() => {
        onUploadSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to analyze demo report.");
      console.error("Demo analysis error:", err);
    } finally {
      setUploading(false);
      setProcessingDemoId(null);
      setPipelineStep(0);
    }
  };

  // Standard Upload handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    const check = validateSelectedFile(file);
    if (!check.valid) {
      setError(check.error || "Only PNG, JPG, or PDF files are accepted.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setPipelineStep(1);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const uniqueId = crypto.randomUUID();
      const filePath = `${user.id}/${uniqueId}.${fileExt}`;

      // Step 1: Storage upload
      const { error: storageError } = await supabase.storage
        .from("reports")
        .upload(filePath, file);

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // Step 2: Trigger backend OCR
      setPipelineStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setPipelineStep(3);

      await api.post("/reports", {
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        recorded_at: recordedAt
      });

      // Step 4 & 5: Structuring & Saving
      setPipelineStep(4);
      await new Promise((r) => setTimeout(r, 800));
      setPipelineStep(5);
      await new Promise((r) => setTimeout(r, 600));

      setSuccess("Report uploaded successfully! Added to your health intelligence timeline.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setTimeout(() => {
        onUploadSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to process and upload document.");
      console.error("Upload error details:", err);
    } finally {
      setUploading(false);
      setPipelineStep(0);
    }
  };

  return (
    <div className="space-y-6 w-full fade-in">
      
      {/* ================= PIPELINE STATUS OVERLAY (WHEN UPLOADING) ================= */}
      {uploading && pipelineStep > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border border-teal-500/30 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Processing Medical Report</h3>
                <p className="text-xs text-slate-400 font-mono">Executing 5-Stage Ingestion Pipeline</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/15 px-3 py-1 rounded-full border border-teal-500/30">
              Stage {pipelineStep} of 5
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {pipelineSteps.map((s, idx) => {
              const stepNum = idx + 1;
              const isCompleted = pipelineStep > stepNum;
              const isCurrent = pipelineStep === stepNum;

              return (
                <div 
                  key={s.num}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrent 
                      ? "bg-teal-950/80 border-teal-400 text-white shadow-md shadow-teal-500/20" 
                      : isCompleted
                      ? "bg-white/5 border-teal-500/40 text-teal-200"
                      : "bg-white/5 border-white/5 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold">{s.num}</span>
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 text-teal-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-300" />
                    ) : null}
                  </div>
                  <h4 className="text-xs font-bold leading-tight mb-1">{s.title}</h4>
                  <p className="text-[10px] leading-tight opacity-75">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 1-CLICK SYNTHETIC DEMO REPORTS ================= */}
      <div className="panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Try Demo Lab Reports (Instant 1-Click Live Analysis)
              </h3>
              <p className="text-xs text-slate-500">
                Experience real OCR extraction and LLM insights without using personal files.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-200/80 self-start sm:self-auto font-mono">
            <ShieldAlert className="h-3 w-3 text-teal-600" />
            Synthetic Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {DEMO_REPORTS.map((demo) => {
            const isProcessingThis = uploading && processingDemoId === demo.id;

            return (
              <div
                key={demo.id}
                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 hover:border-teal-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase font-mono">
                      {demo.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {demo.date}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    {demo.title}
                  </h4>

                  <ul className="text-[11px] text-slate-600 space-y-1 mb-3">
                    {demo.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                        <span className="truncate">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {demo.alertNotice && (
                    <div className="mb-3 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[10.5px] text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span className="truncate font-medium">{demo.alertNotice}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeDemoReport(demo)}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {isProcessingThis ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>1-Click Analyze</span>
                      </>
                    )}
                  </button>

                  <a
                    href={demo.fileUrl}
                    download={demo.fileName}
                    title="Download synthetic PDF"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 hover:text-teal-700 text-xs transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= PREMIUM DROP ZONE ================= */}
      <div className="panel-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Upload Your Lab Report
          </h3>
          <p className="text-xs text-slate-500">
            Securely upload personal laboratory documents (PDF, PNG, or JPG).
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Drag and Drop Container */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              file
                ? "border-teal-600 bg-teal-50/40"
                : "border-slate-200 hover:border-teal-600/50 bg-[#FDFBF7]/70 hover:bg-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            
            <div className="h-16 w-16 mx-auto rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-2xs">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h4 className="text-base font-heading font-bold text-slate-900">
              {file ? file.name : "Drop your lab report here, or browse files"}
            </h4>

            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              PDF, PNG, or JPG (up to 15MB). Blood panels, CBC, lipid tests, and metabolic scans.
            </p>

            {file && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-mono font-bold">
                <FileText className="h-3.5 w-3.5" />
                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Selected</span>
              </div>
            )}
          </div>

          {/* Metadata Row: Report Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span>Test Collection Date</span>
              </label>
              <input
                type="date"
                required
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Analysis Pipeline</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
};
