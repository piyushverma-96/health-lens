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
  ShieldAlert
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
    category: "Liver & Kidney Function",
    date: "2025-12-15",
    fileName: "Comprehensive_Metabolic_Panel_Demo.pdf",
    fileUrl: "/demo-reports/Comprehensive_Metabolic_Panel_Demo.pdf",
    highlights: ["Fasting Glucose 92 mg/dL", "Creatinine 0.9 mg/dL", "ALT 24 U/L", "AST 22 U/L", "BUN 14 mg/dL"],
  },
  {
    id: "cbc",
    title: "Complete Blood Count & Vitamins",
    category: "Hematology & Micronutrients",
    date: "2026-02-10",
    fileName: "Complete_Blood_Count_and_Vitamins_Demo.pdf",
    fileUrl: "/demo-reports/Complete_Blood_Count_and_Vitamins_Demo.pdf",
    highlights: ["Hemoglobin 14.2 g/dL", "Platelets 250 x10^3", "Vitamin D 19.5 ng/mL (Low)", "B12 480 pg/mL"],
    alertNotice: "Deficiency Alert: Vitamin D is sub-optimal (19.5 ng/mL)"
  },
  {
    id: "lipid",
    title: "Cardiovascular Lipid & Thyroid Profile",
    category: "Lipid Panel & Endocrine",
    date: "2026-03-05",
    fileName: "Cardiovascular_Lipid_and_Thyroid_Demo.pdf",
    fileUrl: "/demo-reports/Cardiovascular_Lipid_and_Thyroid_Demo.pdf",
    highlights: ["Total Cholesterol 215 mg/dL (High)", "LDL 138 mg/dL (High)", "HDL 48 mg/dL", "HbA1c 5.4%", "TSH 2.1"],
    alertNotice: "Elevated Alert: LDL is 138 mg/dL (Atherogenic Risk)"
  }
];

export const ReportUploader: React.FC<ReportUploaderProps> = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [recordedAt, setRecordedAt] = useState<string>(
    new Date().toISOString().split("T")[0] // Default to today
  );
  
  const [uploading, setUploading] = useState(false);
  const [processingDemoId, setProcessingDemoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf"];
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

  const validateSelectedFile = (selectedFile: File): { valid: boolean; error?: string } => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file format (.${ext || "unknown"}). Only PNG, JPG, or PDF files are accepted for medical reports. Please upload a valid .png, .jpg, or .pdf report.`
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
        setSuccess(null);
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const check = validateSelectedFile(selectedFile);
      if (!check.valid) {
        setError(check.error || "Only PNG, JPG, or PDF files are accepted.");
        setSuccess(null);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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

    try {
      // 1. Fetch genuine demo PDF file from public static asset
      const response = await fetch(demo.fileUrl);
      if (!response.ok) {
        throw new Error(`Could not load sample PDF (${response.statusText}).`);
      }
      const blob = await response.blob();
      const demoFile = new File([blob], demo.fileName, { type: "application/pdf" });

      // 2. Upload real PDF to private Supabase Storage bucket
      const uniqueId = crypto.randomUUID();
      const filePath = `${user.id}/${uniqueId}.pdf`;

      const { error: storageError } = await supabase.storage
        .from("reports")
        .upload(filePath, demoFile);

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // 3. Trigger genuine backend OCR & Groq parsing pipeline
      await api.post("/reports", {
        file_path: filePath,
        file_name: demo.fileName,
        mime_type: "application/pdf",
        recorded_at: demo.date
      });

      setSuccess(`Analysis started for "${demo.title}"! Live Groq extraction & 9-section report generation in progress.`);
      
      // Notify parent to refresh listings
      setTimeout(() => {
        onUploadSuccess();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to analyze demo report.");
      console.error("Demo analysis error:", err);
    } finally {
      setUploading(false);
      setProcessingDemoId(null);
    }
  };

  // Standard Upload handler for user-selected files
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

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const uniqueId = crypto.randomUUID();
      const filePath = `${user.id}/${uniqueId}.${fileExt}`;

      // 1. Upload the file to the private 'reports' Supabase Storage bucket
      const { error: storageError } = await supabase.storage
        .from("reports")
        .upload(filePath, file);

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // 2. Call our backend API to log the report and kick off OCR parsing
      await api.post("/reports", {
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        recorded_at: recordedAt
      });

      setSuccess("Report uploaded successfully! Processing and OCR analysis started.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Notify parent component to reload listings
      setTimeout(() => {
        onUploadSuccess();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to process and upload document.");
      console.error("Upload error details:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 w-full fade-in">
      {/* ================= DEMO / SYNTHETIC SAMPLE REPORTS SECTION ================= */}
      <div className="bg-gradient-to-br from-amber-50/70 via-white to-sky-50/50 p-5 md:p-6 rounded-2.5xl border border-gold-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-leaf/10 border border-gold-leaf/20 flex items-center justify-center text-gold-leaf">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-clinical-slate tracking-tight">
                Try Demo Lab Reports (Instant Live Analysis)
              </h3>
              <p className="text-[11px] text-gray-500">
                Test HealthLens AI in real time without uploading personal files.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100/80 text-amber-900 border border-amber-300/60 self-start sm:self-auto">
            <ShieldAlert className="h-3 w-3 text-amber-700" />
            Synthetic Demo Data
          </span>
        </div>

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Select any of the 3 realistic synthetic lab reports below to run our full live backend pipeline
          (PDF extraction → Groq LLM parsing → Biomarkers extraction → Clinical explanation).
          You can also download the genuine PDF to inspect or upload it manually.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {DEMO_REPORTS.map((demo) => {
            const isProcessingThis = uploading && processingDemoId === demo.id;

            return (
              <div
                key={demo.id}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-gold-leaf/60 transition-all duration-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-gold-leaf tracking-wider uppercase">
                      {demo.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {demo.date}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-clinical-slate mb-2 line-clamp-2">
                    {demo.title}
                  </h4>

                  <ul className="text-[11px] text-gray-600 space-y-1 mb-3">
                    {demo.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-leaf/60 shrink-0" />
                        <span className="truncate">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {demo.alertNotice && (
                    <div className="mb-3 px-2 py-1 bg-amber-50 border border-amber-200/60 rounded-lg text-[10px] text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
                      <span className="truncate">{demo.alertNotice}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeDemoReport(demo)}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gold-leaf hover:bg-gold-muted text-white text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-50 shadow-2xs"
                  >
                    {isProcessingThis ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Extracting...</span>
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
                    title="Download synthetic PDF report"
                    className="flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:border-gold-leaf text-gray-600 hover:text-gold-leaf text-xs font-semibold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CUSTOM FILE UPLOADER SECTION ================= */}
      <div className="bg-white p-5 md:p-6 rounded-2.5xl border border-gold-border shadow-sm w-full">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-clinical-slate tracking-tight">
            Upload Your Own Medical Report
          </h3>
          <p className="text-xs text-gray-500">
            Upload personal laboratory results (PNG, JPG, or PDF).
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed">{success}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
              file
                ? "border-gold-leaf bg-gold-leaf/5 shadow-xs"
                : "border-gray-200 hover:border-gold-leaf bg-gold-light/40 hover:bg-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            <UploadCloud className={`h-12 w-12 mx-auto mb-3 transition-transform duration-300 ${file ? "text-gold-leaf scale-110" : "text-gray-400 hover:scale-105"}`} />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-clinical-slate truncate max-w-md mx-auto">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-red-500 hover:text-red-700 underline font-medium cursor-pointer"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-clinical-slate">
                  Select a medical report or drag and drop
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-gold-leaf/10 text-gold-leaf text-[10px] font-bold tracking-wider font-mono">PNG</span>
                  <span className="px-2 py-0.5 rounded-md bg-gold-leaf/10 text-gold-leaf text-[10px] font-bold tracking-wider font-mono">JPG / JPEG</span>
                  <span className="px-2 py-0.5 rounded-md bg-gold-leaf/10 text-gold-leaf text-[10px] font-bold tracking-wider font-mono">PDF</span>
                </div>
                <p className="text-xs text-gray-400">
                  Only PNG, JPG, or PDF files are accepted (Max 15MB)
                </p>
              </div>
            )}
          </div>

          {/* Date Selector */}
          {file && (
            <div className="bg-gold-light/40 p-5 rounded-2xl border border-gold-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-in">
              <div className="flex items-center gap-3 text-clinical-slate">
                <Calendar className="h-5 w-5 text-gold-leaf" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Report Date</p>
                  <p className="text-[10px] text-gray-400">Date this blood test was actually performed</p>
                </div>
              </div>
              <input
                type="date"
                required
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gold-leaf text-clinical-slate font-mono"
              />
            </div>
          )}

          {/* Submit Action */}
          {file && (
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-gold-leaf hover:bg-gold-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-leaf transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
            >
              {uploading && !processingDemoId ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading and extracting text...</span>
                </div>
              ) : (
                "Extract Biomarkers"
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
