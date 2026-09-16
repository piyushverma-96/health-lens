import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { ChatMessage } from "../hooks/useChat";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Loader2, 
  User as UserIcon, 
  HeartPulse, 
  BookOpen,
  Trash2,
  ArrowRight,
  X,
  AlertCircle,
  FileText,
  UploadCloud,
  Paperclip
} from "lucide-react";
import { ReportUploader } from "./ReportUploader";
import { supabase } from "../services/supabase";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useBiomarkers } from "../hooks/useBiomarkers";

interface HealthAssistantProps {
  preloadedPrompt: string | null;
  onClearPreload: () => void;
  onNavigate: (tabId: string) => void;
}

export const HealthAssistant: React.FC<HealthAssistantProps> = ({ 
  preloadedPrompt, 
  onClearPreload,
  onNavigate
}) => {
  const { useGetSessions, useGetMessages, useCreateSession, useSendMessage, useDeleteSession } = useChat();
  const { data: sessions, isLoading: sessionsLoading } = useGetSessions();
  const { profile } = useAuth();
  const { useGetBiomarkerSummary } = useBiomarkers();
  const { data: biomarkerSummary } = useGetBiomarkerSummary();
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { data: messages, isLoading: messagesLoading } = useGetMessages(activeSessionId);
  
  const createSessionMutation = useCreateSession();
  const sendMessageMutation = useSendMessage();
  const deleteSessionMutation = useDeleteSession();
  
  const [inputMessage, setInputMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingMessage, sendMessageMutation.isPending]);

  // Handle Ask More preloaded prompts automatically
  useEffect(() => {
    const triggerPreload = async () => {
      if (!preloadedPrompt) return;
      
      const prompt = preloadedPrompt;
      onClearPreload(); // Clear immediately to avoid duplicate runs
      setChatError(null);
      setPendingMessage(prompt);

      try {
        let targetSessionId = activeSessionId;
        
        // Create session if none is selected
        if (!targetSessionId) {
          const newSession = await createSessionMutation.mutateAsync("Deep Dive Analysis");
          targetSessionId = newSession.id;
          setActiveSessionId(newSession.id);
        }
        
        // Send the preloaded prompt
        await sendMessageMutation.mutateAsync({
          sessionId: targetSessionId,
          content: prompt
        });
      } catch (err: any) {
        console.error("Failed to process preloaded prompt:", err);
        setChatError(err.message || "Failed to process question. Please try again.");
      } finally {
        setPendingMessage(null);
      }
    };

    triggerPreload();
  }, [preloadedPrompt, activeSessionId]);

  const handleCreateSession = async () => {
    setChatError(null);
    try {
      const newSession = await createSessionMutation.mutateAsync("New Consultation");
      setActiveSessionId(newSession.id);
    } catch (err: any) {
      console.error("Failed to create session:", err);
      setChatError(err.message || "Failed to create consultation.");
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this consultation history?")) {
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");
    setChatError(null);
    setPendingMessage(messageContent);

    try {
      let targetSessionId = activeSessionId;
      
      // If no session is active, create one first
      if (!targetSessionId) {
        const newSession = await createSessionMutation.mutateAsync("New Consultation");
        targetSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      }

      await sendMessageMutation.mutateAsync({
        sessionId: targetSessionId,
        content: messageContent
      });
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setChatError(err.message || "Failed to deliver message to Health Assistant.");
      setInputMessage(messageContent); // Restore on failure
    } finally {
      setPendingMessage(null);
    }
  };

  const handleSuggestionClick = async (text: string) => {
    if (sendMessageMutation.isPending) return;
    setChatError(null);
    setPendingMessage(text);

    let targetSessionId = activeSessionId;
    
    // Create new session if none is selected
    if (!targetSessionId) {
      try {
        const newSession = await createSessionMutation.mutateAsync("Health Inquiry");
        targetSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      } catch (err: any) {
        console.error("Failed to create session for suggestion:", err);
        setChatError(err.message || "Failed to start consultation session.");
        setPendingMessage(null);
        return;
      }
    }

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: targetSessionId,
        content: text
      });
    } catch (err: any) {
      console.error("Failed to send suggestion query:", err);
      setChatError(err.message || "Failed to generate health insight.");
    } finally {
      setPendingMessage(null);
    }
  };

  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [chatUploadStatus, setChatUploadStatus] = useState<string | null>(null);

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setChatUploadStatus(`Uploading ${file.name}...`);
    setChatError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const uniqueId = crypto.randomUUID();
      const userId = profile?.id || "c5a1d5eb-7b58-407c-a779-9991525c1852";
      const filePath = `${userId}/${uniqueId}.${fileExt}`;

      // Upload to Supabase Storage bucket 'reports'
      const { error: storageError } = await supabase.storage
        .from("reports")
        .upload(filePath, file);

      if (storageError) {
        console.warn("Storage upload notice:", storageError);
      }

      // Register report in backend
      await api.post("/reports", {
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        recorded_at: new Date().toISOString().split("T")[0]
      });

      setChatUploadStatus(null);

      // Trigger automatic AI consultation on the uploaded report
      const prompt = `I have uploaded my laboratory report / medical test image: "${file.name}". Please analyze the extracted biomarkers, note any abnormal values, and provide clinical recommendations.`;
      handleSuggestionClick(prompt);
    } catch (err: any) {
      console.error("Chat file upload error:", err);
      setChatError(err.message || "Failed to upload report image.");
      setChatUploadStatus(null);
    } finally {
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = "";
      }
    }
  };

  const toggleSource = (msgId: string, idx: number) => {
    const key = `${msgId}-${idx}`;
    setExpandedSources(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSourceDetails = (sources: ChatMessage["sources"], msgId: string) => {
    if (!sources || sources.length === 0) return null;
    return (
      <div className="mt-4 pt-3 border-t border-gray-150 space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
          <BookOpen className="h-3 w-3" /> Cited Sources (Click to expand):
        </span>
        <div className="flex flex-col gap-1.5">
          {sources.map((source, idx) => {
            const key = `${msgId}-${idx}`;
            const isExpanded = !!expandedSources[key];
            let label = "";
            let details = "";
            
            if (source.type === "report_excerpt") {
              label = "📄 Cited Report Excerpt";
              details = source.snippet || "No snippet detail available.";
            } else if (source.type === "medical_fact") {
              label = `📚 Clinical Reference: ${source.topic || "Fact"}`;
              details = source.content || "Clinical insight from knowledge database.";
            } else if (source.type === "biomarker_history" && source.biomarkers) {
              label = `📈 Historical Trend Timeline`;
              details = `References chronological history for: ${source.biomarkers.join(", ")}`;
            } else {
              return null;
            }

            return (
              <div key={idx} className="border border-gold-border rounded-lg overflow-hidden bg-gold-light/10">
                <button
                  type="button"
                  onClick={() => toggleSource(msgId, idx)}
                  className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-clinical-slate hover:bg-gold-leaf/5 hover:text-gold-leaf transition-all flex items-center justify-between cursor-pointer focus:outline-none"
                >
                  <span>{label}</span>
                  <span className="text-[9px] text-gray-400 font-mono">{isExpanded ? "Collapse ▲" : "Expand ▼"}</span>
                </button>
                {isExpanded && (
                  <div className="px-3 py-2 bg-white text-[10px] text-gray-500 border-t border-gold-border leading-relaxed font-mono whitespace-pre-wrap text-clinical-slate">
                    {details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleExportPDF = () => {
    if (!messages || messages.length === 0) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the consultation PDF.");
      return;
    }
    
    const sessionTitle = sessions?.find(s => s.id === activeSessionId)?.title || "HealthLens Consultation";
    const patientName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Patient";
    const dateStr = new Date().toLocaleDateString();

    let messagesHtml = "";
    messages.forEach((msg) => {
      const senderName = msg.sender === "user" ? patientName : "HealthLens AI Assistant";
      let cleanContent = msg.content;
      if (msg.sender === "assistant") {
        cleanContent = msg.content.replace("This is educational information and not a medical diagnosis.", "").trim();
      }
      
      const formattedContent = cleanContent
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/^- (.*?)$/gm, "<li>$1</li>")
        .replace(/\n/g, "<br/>");

      messagesHtml += `
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #EFECE6; page-break-inside: avoid;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #D4AF37; font-family: monospace; margin-bottom: 6px;">
            ${senderName}
          </div>
          <div style="font-size: 12px; line-height: 1.6; color: #2A3439; font-family: sans-serif;">
            ${formattedContent}
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>${sessionTitle}</title>
          <style>
            @media print {
              body { background: white; color: black; }
              .no-print { display: none; }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              background-color: #FAF9F6;
            }
            .header {
              border-bottom: 2px solid #D4AF37;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 22px;
              font-weight: bold;
              color: #2A3439;
              margin: 0;
            }
            .meta {
              font-size: 11px;
              color: #71797E;
              margin-top: 8px;
              font-family: monospace;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #D4AF37;
              padding-top: 20px;
              font-size: 10px;
              color: #71797E;
              font-family: monospace;
              text-align: center;
            }
            .btn-print {
              background-color: #D4AF37;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 12px;
              font-weight: bold;
              border-radius: 8px;
              cursor: pointer;
              margin-bottom: 20px;
            }
            .btn-print:hover {
              background-color: #B08D26;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;">
            <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="header">
            <div class="title">${sessionTitle}</div>
            <div class="meta">
              Patient: ${patientName} &nbsp;|&nbsp; Date: ${dateStr} &nbsp;|&nbsp; Generated by HealthLens AI
            </div>
          </div>
          <div class="content">
            ${messagesHtml}
          </div>
          <div class="footer">
            This is educational information and not a medical diagnosis. &copy; 2026 HealthLens.
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportDoctorGuide = () => {
    if (!messages || messages.length === 0) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the Doctor Guide.");
      return;
    }
    
    const sessionTitle = sessions?.find(s => s.id === activeSessionId)?.title || "HealthLens Consultation";
    const patientName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Patient";
    const dobStr = profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "N/A";
    const genderStr = profile?.gender ? profile.gender.toUpperCase() : "N/A";
    const heightStr = profile?.height ? `${profile.height} cm` : "N/A";
    const bloodStr = profile?.blood_group ? profile.blood_group : "N/A";
    const dateStr = new Date().toLocaleDateString();

    // Filter abnormal biomarkers
    const abnormalBiomarkers = biomarkerSummary
      ? biomarkerSummary.filter(b => b.status === "high" || b.status === "low")
      : [];
    let abnormalHtml = "";
    if (abnormalBiomarkers.length > 0) {
      abnormalBiomarkers.forEach(b => {
        abnormalHtml += `
          <tr style="border-bottom: 1px solid #EFECE6;">
            <td style="padding: 8px 0; font-size: 11px; font-weight: bold; color: #2A3439;">${b.name}</td>
            <td style="padding: 8px 0; font-size: 11px; color: ${b.status === "high" ? "#DC143C" : "#191970"}; font-weight: bold;">
              ${b.value} ${b.unit} (${b.status.toUpperCase()})
            </td>
            <td style="padding: 8px 0; font-size: 11px; color: #71797E;">${b.reference_range || "N/A"}</td>
            <td style="padding: 8px 0; font-size: 11px; color: #71797E;">${new Date(b.recorded_at).toLocaleDateString()}</td>
          </tr>
        `;
      });
    } else {
      abnormalHtml = `<tr><td colspan="4" style="padding: 8px 0; font-size: 11px; font-style: italic; color: #71797E;">No out-of-range biomarkers detected in database memory.</td></tr>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Clinical Discussion Guide - ${patientName} (${sessionTitle})</title>
          <style>
            @media print {
              body { background: white; color: black; }
              .no-print { display: none; }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              background-color: #FAF9F6;
            }
            .header {
              border-bottom: 3px double #D4AF37;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 20px;
              font-weight: bold;
              color: #2A3439;
              text-transform: uppercase;
            }
            .section-title {
              font-size: 12px;
              font-weight: bold;
              color: #2A3439;
              text-transform: uppercase;
              border-bottom: 1px solid #D4AF37;
              padding-bottom: 4px;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
            }
            th {
              border-bottom: 2px solid #EFECE6;
              font-size: 10px;
              text-transform: uppercase;
              color: #71797E;
              padding-bottom: 6px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Clinical Discussion Guide</div>
            <div style="font-size: 11px; color: #71797E; margin-top: 4px;">
              Patient: ${patientName} | DOB: ${dobStr} | Sex: ${genderStr} | Height: ${heightStr} | Blood: ${bloodStr} | Date: ${dateStr}
            </div>
          </div>
          <div class="section-title">Critical Biomarkers (Out of Range)</div>
          <table>
            <thead>
              <tr>
                <th>Biomarker</th>
                <th>Recorded Value</th>
                <th>Reference Range</th>
                <th>Recorded Date</th>
              </tr>
            </thead>
            <tbody>
              ${abnormalHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const suggestions = [
    {
      title: "Review Cholesterol",
      desc: "Analyze my LDL trends and cardiovascular profile.",
      prompt: "Can you review my latest cholesterol levels and summarize my cardiovascular health markers?"
    },
    {
      title: "Vitamin D Insights",
      desc: "How can I improve my Vitamin D levels?",
      prompt: "What are my Vitamin D trend levels, and what diet/lifestyle actions support them?"
    },
    {
      title: "Explain HbA1c",
      desc: "Check my blood sugar and metabolic markers.",
      prompt: "What is my HbA1c baseline and what do these blood sugar values imply?"
    },
    {
      title: "Health Tracker Plan",
      desc: "Create a biomarker monitoring schedule.",
      prompt: "I want to set up a personalized biomarker tracking schedule. What markers should I monitor regularly?"
    }
  ];

  // Abnormal biomarkers count for badge
  const abnormalCount = biomarkerSummary ? biomarkerSummary.filter(b => b.status === "high" || b.status === "low").length : 0;
  const totalBiomarkersCount = biomarkerSummary ? biomarkerSummary.length : 0;

  // Decide if we show active chat conversation vs welcome screen
  const hasMessages = messages && messages.length > 0;
  const showChatView = activeSessionId !== null || pendingMessage !== null;

  return (
    <div className="flex flex-col lg:flex-row items-stretch h-full w-full bg-white fade-in">
      {/* ================= LEFT SIDEBAR (CONVERSATIONS) ================= */}
      <aside className="hidden lg:flex lg:w-64 border-r border-gold-border/60 bg-[#FAF9F6]/40 p-4 flex flex-col justify-between shrink-0 h-full overflow-hidden">
        <div className="space-y-4 overflow-hidden flex flex-col flex-grow">
          <button
            onClick={handleCreateSession}
            disabled={createSessionMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gold-border hover:border-gold-leaf text-gold-leaf hover:bg-gold-leaf/5 bg-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all active:scale-[0.97] disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-gold-leaf" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Consultation
          </button>
          
          <div className="h-px bg-gray-150 shrink-0"></div>
          
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 shrink-0 font-mono">
            Conversations
          </h3>
          
          <div className="flex-grow overflow-y-auto space-y-1.5 pr-1">
            {sessionsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gold-leaf" />
              </div>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between rounded-xl transition-all ${
                    activeSessionId === session.id
                      ? "bg-gold-leaf/10 text-gold-leaf font-semibold"
                      : "text-clinical-slate hover:bg-gray-100/80 hover:text-gold-leaf"
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setChatError(null);
                    }}
                    className="flex-grow text-left px-3 py-2.5 text-xs truncate cursor-pointer"
                  >
                    {session.title}
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-2 mr-1 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity cursor-pointer"
                    title="Delete Conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6 font-serif italic">No previous consults.</p>
            )}
          </div>
        </div>

        {/* Quick link to reports */}
        <div className="pt-3 border-t border-gray-150">
          <button
            onClick={() => onNavigate("history")}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gold-leaf hover:bg-gold-leaf/5 rounded-xl transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              View Lab Reports
            </span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CHAT VIEWPORT ================= */}
      <main className="flex-1 bg-white flex flex-col justify-between overflow-hidden h-full relative">
        {/* Session Header */}
        <div className="px-6 py-4 border-b border-gold-border/60 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {/* Mobile History Toggle button */}
            <button
              onClick={() => setHistoryDrawerOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gold-leaf rounded-lg transition-colors cursor-pointer"
              title="View Previous Consultations"
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-slate font-mono">
                  {activeSessionId 
                    ? (sessions?.find(s => s.id === activeSessionId)?.title || "Active Consultation")
                    : "HealthLens AI Health Coach"
                  }
                </h3>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">
                Real-time clinical intelligence timeline powered by Groq
              </p>
            </div>
          </div>

          {activeSessionId && hasMessages && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportDoctorGuide}
                className="px-3.5 py-1.5 border border-gold-border hover:border-gold-leaf text-gold-leaf hover:bg-gold-leaf/5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer focus:outline-none"
              >
                Doctor Guide
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3.5 py-1.5 border border-gold-border hover:border-gold-leaf text-gold-leaf hover:bg-gold-leaf/5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer focus:outline-none"
              >
                Export PDF
              </button>
            </div>
          )}
        </div>

        {/* Chat Messages Log OR Welcome View */}
        <div className="flex-1 overflow-y-auto pt-6 pb-28 px-4 sm:px-6 space-y-6 bg-[#FAF9F6]/30">
          {chatError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start justify-between gap-3 max-w-2xl mx-auto shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-bold">Assistant Request Error</p>
                  <p className="text-[11px] text-red-600 mt-0.5">{chatError}</p>
                </div>
              </div>
              <button
                onClick={() => setChatError(null)}
                className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {showChatView ? (
            /* ================= ACTIVE CONVERSATION VIEW ================= */
            <div className="space-y-6 max-w-3xl mx-auto">
              {messagesLoading && !hasMessages ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Loader2 className="h-6 w-6 text-gold-leaf animate-spin mb-2" />
                  <p className="text-xs text-gray-400">Loading consultation messages...</p>
                </div>
              ) : (
                <>
                  {!hasMessages && !pendingMessage && (
                    <div className="text-center py-12 px-4 max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gold-leaf/10 border border-gold-leaf/20 flex items-center justify-center mx-auto text-gold-leaf">
                        <HeartPulse className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-clinical-slate">
                        Consultation Session Started
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Ask about your recent lab numbers, trend trajectories, diet adjustments, or clinical questions to bring to your doctor.
                      </p>
                    </div>
                  )}

                  {/* Render saved messages */}
                  {messages?.map((msg) => {
                    const isUser = msg.sender === "user";
                    const isDisclaimer = msg.content.includes("This is educational information");
                    let cleanedContent = msg.content;
                    if (isDisclaimer) {
                      cleanedContent = msg.content.replace("This is educational information and not a medical diagnosis.", "").trim();
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ${
                          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${
                          isUser 
                            ? "bg-[#F5F3EF] border-gray-200 text-clinical-slate shadow-xs" 
                            : "bg-white border-gold-border text-gold-leaf shadow-xs"
                        }`}>
                          {isUser ? <UserIcon className="h-3.5 w-3.5 text-gray-500" /> : <HeartPulse className="h-3.5 w-3.5 text-gold-leaf" />}
                        </div>

                        {/* Content Block */}
                        <div className={`text-sm leading-relaxed ${
                          isUser
                            ? "bg-[#F5F3EF] border border-transparent rounded-2xl rounded-tr-none px-4 py-3 text-clinical-slate font-medium shadow-xs"
                            : "bg-white border border-gray-100 rounded-2xl px-5 py-4 text-clinical-slate shadow-xs"
                        }`}>
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{cleanedContent}</p>
                          ) : (
                            <MarkdownRenderer content={cleanedContent} />
                          )}
                          
                          {!isUser && isDisclaimer && (
                            <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-mono italic">
                              This is educational information and not a medical diagnosis.
                            </div>
                          )}

                          {!isUser && getSourceDetails(msg.sources, msg.id)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Render instant optimistic user message while pending */}
                  {pendingMessage && (
                    <div className="flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ml-auto flex-row-reverse animate-fade-in">
                      <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border bg-[#F5F3EF] border-gray-200 text-clinical-slate shadow-xs">
                        <UserIcon className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="bg-[#F5F3EF] border border-transparent rounded-2xl rounded-tr-none px-4 py-3 text-clinical-slate font-medium shadow-xs text-sm">
                        <p className="whitespace-pre-wrap">{pendingMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Live Assistant Generating Indicator */}
                  {sendMessageMutation.isPending && (
                    <div className="flex gap-3 sm:gap-4 max-w-[85%] mr-auto fade-in">
                      <div className="h-8 w-8 rounded-full bg-white border border-gold-border text-gold-leaf flex items-center justify-center shrink-0 shadow-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-gold-leaf" />
                      </div>
                      <div className="bg-white border border-gold-border/40 rounded-2xl px-4 py-3 shadow-xs flex items-center gap-2.5 text-xs text-gray-500">
                        <span className="font-semibold text-clinical-slate animate-pulse">
                          Reviewing timeline & consulting clinical records...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ================= WELCOME SCREEN ================= */
            <div className="h-full flex flex-col justify-center max-w-3xl mx-auto py-8 px-2 space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gold-leaf/10 border border-gold-leaf/25 flex items-center justify-center mx-auto text-gold-leaf shadow-xs">
                  <HeartPulse className="h-7 w-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 tracking-tight">
                  How can I support your health today?
                </h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  I review your laboratory reports, track your personalized biomarker trajectory over time, and translate complex clinical markers into clear next steps.
                </p>

                {/* Health Memory Status Pill */}
                <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-mono">
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-clinical-slate shadow-2xs">
                    📊 <b>{totalBiomarkersCount}</b> Biomarkers in Memory
                  </span>
                  {abnormalCount > 0 && (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full font-bold shadow-2xs">
                      ⚠️ <b>{abnormalCount}</b> Needs Review
                    </span>
                  )}
                </div>
              </div>

              {/* Suggested Questions Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                    Suggested Consultations
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">Click to begin</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug.prompt)}
                      className="text-left p-4 bg-white border border-gold-border/60 hover:border-gold-leaf hover:bg-gold-leaf/5 rounded-2xl shadow-xs transition-all group duration-200 cursor-pointer"
                    >
                      <p className="text-xs font-bold text-gray-900 group-hover:text-gold-leaf transition-colors flex items-center justify-between">
                        {sug.title}
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gold-leaf group-hover:translate-x-0.5 transition-all" />
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                        {sug.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ================= REPORT UPLOADER & DEMO LABS SECTION ================= */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gold-leaf/10 text-gold-leaf">
                      <UploadCloud className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-clinical-slate font-heading">
                        Upload Laboratory Report or Medical Image
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Upload doctor prescription or blood test images (.png, .jpg, .jpeg) or PDFs, or test with our 1-click synthetic demo panels below.
                      </p>
                    </div>
                  </div>
                </div>

                <ReportUploader onUploadSuccess={() => onNavigate("history")} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= FLOATING CHAT INPUT BAR ================= */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-5 px-4 z-20">
          {chatUploadStatus && (
            <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 text-xs text-gold-leaf bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-xl shadow-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{chatUploadStatus}</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex items-center">
            {/* Direct Image / Document Attachment Button */}
            <input
              type="file"
              ref={chatFileInputRef}
              onChange={handleChatFileUpload}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              disabled={!!chatUploadStatus || sendMessageMutation.isPending}
              className="absolute left-2.5 p-2 text-gray-400 hover:text-gold-leaf hover:bg-gold-leaf/5 rounded-xl transition-all cursor-pointer z-10"
              title="Upload lab report image (.png, .jpg, .jpeg) or PDF"
            >
              {chatUploadStatus ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold-leaf" />
              ) : (
                <Paperclip className="h-4 w-4 text-clinical-slate hover:text-gold-leaf" />
              )}
            </button>

            <input
              type="text"
              placeholder="Ask your health coach about report biomarkers, symptoms, or tracking goals..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sendMessageMutation.isPending}
              className="w-full pl-11 pr-12 py-3.5 border border-gold-border bg-white rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-leaf/20 focus:border-gold-leaf text-clinical-slate font-medium shadow-xs placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
              className="absolute right-2 p-2 bg-gold-leaf hover:bg-gold-muted text-white rounded-xl transition-all active:scale-[0.95] disabled:opacity-30 disabled:hover:bg-gold-leaf cursor-pointer shadow-2xs"
              title="Send Message"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </main>

      {/* ================= MOBILE HISTORY DRAWER ================= */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end animate-fade-in">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setHistoryDrawerOpen(false)}
          />
          
          <aside className="relative w-72 max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col justify-between z-10 animate-slide-in-right">
            <div className="space-y-4 overflow-hidden flex flex-col flex-grow">
              <div className="flex items-center justify-between pb-3 border-b border-gold-border/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-slate font-mono">
                  Consultations
                </h3>
                <button
                  onClick={() => setHistoryDrawerOpen(false)}
                  className="p-1 text-gray-400 hover:text-gold-leaf rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  handleCreateSession();
                  setHistoryDrawerOpen(false);
                }}
                disabled={createSessionMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gold-border hover:border-gold-leaf text-gold-leaf hover:bg-gold-leaf/5 bg-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all active:scale-[0.97] disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gold-leaf" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                New Consultation
              </button>

              <div className="flex-grow overflow-y-auto space-y-1.5 pr-1">
                {sessionsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gold-leaf" />
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center justify-between rounded-xl transition-all ${
                        activeSessionId === session.id
                          ? "bg-gold-leaf/10 text-gold-leaf font-semibold"
                          : "text-clinical-slate hover:bg-gray-100/80 hover:text-gold-leaf"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setHistoryDrawerOpen(false);
                        }}
                        className="flex-grow text-left px-3 py-2.5 text-xs truncate cursor-pointer"
                      >
                        {session.title}
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 mr-1 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete Conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6 font-serif italic">No previous consults.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
