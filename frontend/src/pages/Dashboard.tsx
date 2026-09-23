import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  LayoutDashboard, 
  LineChart, 
  MessageSquare, 
  LogOut, 
  HeartPulse,
  Menu,
  X,
  User as UserIcon,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  UploadCloud,
  FileText,
  Home
} from "lucide-react";
import { HealthCommandCenter } from "../components/HealthCommandCenter";
import { ReportUploader } from "../components/ReportUploader";
import { ReportHistory } from "../components/ReportHistory";
import { BiomarkerTrends } from "../components/BiomarkerTrends";
import { HealthAssistant } from "../components/HealthAssistant";
import { ProfileSettings } from "../components/ProfileSettings";
import { HealthMemory } from "../components/HealthMemory";
import { OnboardingIntake } from "../components/OnboardingIntake";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, user, signOut } = useAuth();
  
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string, reportId?: string) => {
    setActiveTab(tabId);
    if (reportId) {
      setSelectedReportId(reportId);
    }
    setSearchParams({ tab: tabId });
  };

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatPreload, setChatPreload] = useState<string | null>(null);
  const [showIntakeRetake, setShowIntakeRetake] = useState(false);

  // Navigation Items:
  // Dashboard | Upload Report | Biomarker Trends | AI Assistant | Health Memory | Profile
  const navigation = [
    { id: "overview", name: "Dashboard", icon: LayoutDashboard },
    { id: "upload", name: "Upload Report", icon: UploadCloud },
    { id: "trends", name: "Biomarker Trends", icon: LineChart },
    { id: "chat", name: "AI Assistant", icon: MessageSquare },
    { id: "memory", name: "Health Memory", icon: Database },
    { id: "profile", name: "Profile", icon: UserIcon },
  ];

  const pageMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
    overview: {
      eyebrow: "Command Center",
      title: "Personal Health Intelligence Overview",
      description: "Continuous real-time tracking across your laboratory reports and metabolic trends.",
    },
    chat: {
      eyebrow: "Clinical RAG Intelligence",
      title: "Ask anything about your reports and biomarkers.",
      description: "Get plain-language interpretations, risk context, and informed doctor discussion prompts.",
    },
    upload: {
      eyebrow: "Report Ingestion",
      title: "Upload lab tests, digital PDFs, or clinical scans.",
      description: "Analyze blood work images (.png, .jpg), PDFs, or test with 1-click synthetic demo panels.",
    },
    history: {
      eyebrow: "Report Archive & Analysis",
      title: "Inspect your structured medical reports.",
      description: "Detailed 9-section clinical breakdown with extracted values and abnormal flags.",
    },
    trends: {
      eyebrow: "Biomarker Trends",
      title: "See changes over time, not just isolated numbers.",
      description: "Visualize how cholesterol, Vitamin D, HbA1c, and thyroid numbers move across reports.",
    },
    memory: {
      eyebrow: "Health Memory",
      title: "Persistent clinical facts and personal timeline.",
      description: "Your verified health baseline that informs all future AI explanations and RAG prompts.",
    },
    profile: {
      eyebrow: "Settings & Baseline",
      title: "Personal health profile and demographic calibrations.",
      description: "Update biological sex, date of birth, and lifestyle baseline for tailored reference ranges.",
    },
  };

  const activePage = pageMeta[activeTab] ?? pageMeta.overview;
  const firstName = profile?.first_name || user?.email?.split("@")[0] || "there";

  const renderActiveContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <HealthCommandCenter
            onNavigate={(tabId, repId) => handleTabChange(tabId, repId)}
            onAskMore={(name, value, unit) => {
              setChatPreload(`Tell me more about my ${name} result of ${value} ${unit}. What does this signify?`);
              handleTabChange("chat");
            }}
          />
        );
      case "chat":
        return (
          <HealthAssistant 
            preloadedPrompt={chatPreload} 
            onClearPreload={() => setChatPreload(null)} 
            onNavigate={(tabId) => handleTabChange(tabId)}
          />
        );
      case "upload":
        return (
          <div className="max-w-4xl mx-auto py-2 px-2 sm:px-4 animate-fade-in">
            <ReportUploader onUploadSuccess={() => handleTabChange("history")} />
          </div>
        );
      case "history":
        return (
          <ReportHistory 
            initialSelectedReportId={selectedReportId}
            onAskMore={(name, value, unit) => {
              setChatPreload(`Tell me more about my ${name} result of ${value} ${unit}.`);
              handleTabChange("chat");
            }} 
          />
        );
      case "trends":
        return (
          <BiomarkerTrends />
        );
      case "profile":
        return (
          <ProfileSettings onRetakeIntake={() => setShowIntakeRetake(true)} />
        );
      case "memory":
        return (
          <HealthMemory />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] font-sans flex relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.08),transparent_60%)]" />

      {/* Global Grain SVG Noise Layer */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.016]" xmlns="http://www.w3.org/2000/svg">
        <filter id="dashNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dashNoise)" />
      </svg>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between h-screen sticky top-0 bg-[#FDFBF7] backdrop-blur-xl border-r border-slate-200/80 transition-all duration-300 z-30 shrink-0 shadow-xs ${
          sidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Brand Header */}
          <div className={`p-5 flex items-center justify-between border-b border-slate-100 h-20 shrink-0 ${!sidebarExpanded ? "justify-center" : ""}`}>
            {sidebarExpanded ? (
              <div 
                className="flex items-center gap-3 text-slate-900 cursor-pointer active:scale-[0.98]"
                onClick={() => navigate("/")}
                title="Return to HealthLens landing page"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D9488] text-white shadow-sm shadow-teal-700/20">
                  <HeartPulse className="h-5 w-5 animate-pulse" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[15px] font-heading font-extrabold tracking-tight text-slate-900">HealthLens AI</span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#0D9488] font-bold mt-0.5">INTELLIGENCE</span>
                </div>
              </div>
            ) : (
              <div 
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D9488] text-white shadow-sm shadow-teal-700/20 cursor-pointer active:scale-[0.98]"
                onClick={() => navigate("/")}
                title="Return to HealthLens landing page"
              >
                <HeartPulse className="h-5 w-5 animate-pulse" />
              </div>
            )}

            {sidebarExpanded && (
              <button 
                onClick={() => setSidebarExpanded(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-grow">
            {/* 1-6. MAIN NAVIGATION */}
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer group ${
                    sidebarExpanded ? "px-3.5 py-2.5 text-left" : "p-3 justify-center"
                  } ${
                    isActive
                      ? "bg-[#0D9488] text-white shadow-sm shadow-teal-700/20 font-semibold"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium"
                  }`}
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${sidebarExpanded ? "mr-3" : ""} ${isActive ? "text-white" : "text-slate-400 group-hover:text-[#0D9488]"}`} />
                  {sidebarExpanded && <span className="text-[13px] tracking-normal">{item.name}</span>}
                </button>
              );
            })}

            {/* DIVIDER */}
            <div className="my-2.5 border-t border-slate-200/70 mx-1" />

            {/* 7. ACTION AREA: Reports */}
            <div className="space-y-1">
              <button
                onClick={() => handleTabChange("history")}
                className={`w-full flex items-center rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer group ${
                  sidebarExpanded ? "px-3.5 py-2.5 text-left" : "p-3 justify-center"
                } ${
                  activeTab === "history" 
                    ? "bg-[#0D9488] text-white shadow-sm shadow-teal-700/20 font-semibold" 
                    : "bg-[#E6F4F1]/90 hover:bg-[#D5EFEA] text-[#0D9488] border border-[#B2DFDB]/80 font-semibold shadow-2xs"
                }`}
                title={!sidebarExpanded ? "Reports" : undefined}
              >
                <FileText className={`h-4.5 w-4.5 shrink-0 ${sidebarExpanded ? "mr-3" : ""} ${activeTab === "history" ? "text-white" : "text-[#0D9488]"}`} />
                {sidebarExpanded && (
                  <span className="text-[13px] font-semibold tracking-normal">Reports</span>
                )}
              </button>
            </div>

            {/* DIVIDER */}
            <div className="my-2.5 border-t border-slate-200/70 mx-1" />

            {/* 8. SECONDARY: Home Page */}
            <div className="space-y-1">
              <button
                onClick={() => navigate("/")}
                className={`w-full flex items-center rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer group text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium ${
                  sidebarExpanded ? "px-3.5 py-2.5 text-left" : "p-3 justify-center"
                }`}
                title={!sidebarExpanded ? "Home Page" : "Return to HealthLens landing page"}
              >
                <Home className={`h-4.5 w-4.5 shrink-0 text-slate-400 group-hover:text-[#0D9488] ${sidebarExpanded ? "mr-3" : ""}`} />
                {sidebarExpanded && (
                  <span className="text-[13px] font-medium tracking-normal">Home Page</span>
                )}
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer (User & Logout) */}
        <div className="p-3.5 border-t border-slate-200/80 bg-[#FDFBF7] shrink-0">
          {!sidebarExpanded && (
            <div className="flex justify-center mb-2.5">
              <button 
                onClick={() => setSidebarExpanded(true)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className={`flex items-center justify-between gap-2 ${!sidebarExpanded ? "flex-col" : ""}`}>
            {sidebarExpanded ? (
              <div 
                onClick={() => handleTabChange("profile")}
                className="flex items-center gap-2.5 overflow-hidden cursor-pointer group flex-1 p-1 -m-1 rounded-xl hover:bg-slate-100/70 transition-colors"
                title="Go to Profile"
              >
                <div className="h-8.5 w-8.5 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#0D9488] transition-colors">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Patient"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
            ) : (
              <div 
                className="h-8.5 w-8.5 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                onClick={() => handleTabChange("profile")}
                title="My Profile"
              >
                {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
              </div>
            )}

            <button
              onClick={signOut}
              className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 rounded-xl transition-all active:scale-[0.95] shadow-2xs cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT AREA ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* MOBILE TOP BAR */}
        <header className="md:hidden glass-topbar h-16 px-4 flex items-center justify-between gap-4 shrink-0 z-20 relative">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-700 hover:text-teal-700 rounded-xl transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleTabChange("overview")}
          >
            <div className="h-7 w-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <HeartPulse className="h-4 w-4 animate-pulse" />
            </div>
            <span className="text-sm font-heading font-bold text-slate-900">HealthLens AI</span>
          </div>

          <button
            onClick={() => handleTabChange("upload")}
            className="p-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold"
          >
            <UploadCloud className="h-4 w-4" />
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <aside className="relative w-72 max-w-xs bg-[#FDFBF7] h-full shadow-2xl p-4 flex flex-col justify-between z-10 animate-slide-in-left border-r border-slate-200">
              <div className="flex flex-col flex-grow overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                  <div 
                    className="flex items-center gap-2.5 cursor-pointer"
                    onClick={() => {
                      navigate("/");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <div className="h-8 w-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shadow-xs">
                      <HeartPulse className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-heading font-extrabold text-[15px] text-slate-900">HealthLens AI</span>
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#0D9488] font-bold">INTELLIGENCE</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    title="Close Menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="py-3 space-y-1 flex-grow">
                  {/* 1-6. Main Navigation */}
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleTabChange(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all text-[13px] ${
                          isActive
                            ? "bg-[#0D9488] text-white font-semibold shadow-sm shadow-teal-700/20"
                            : "text-slate-700 hover:bg-slate-100 font-medium"
                        }`}
                      >
                        <Icon className={`mr-3 h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}

                  {/* Divider */}
                  <div className="my-2.5 border-t border-slate-200/70 mx-1" />

                  {/* 7. Action Area: Reports */}
                  <button
                    onClick={() => {
                      handleTabChange("history");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all text-[13px] ${
                      activeTab === "history"
                        ? "bg-[#0D9488] text-white font-semibold shadow-sm shadow-teal-700/20"
                        : "bg-[#E6F4F1] text-[#0D9488] border border-[#B2DFDB]/80 font-semibold"
                    }`}
                  >
                    <FileText className={`mr-3 h-4.5 w-4.5 ${activeTab === "history" ? "text-white" : "text-[#0D9488]"}`} />
                    <span>Reports</span>
                  </button>

                  {/* Divider */}
                  <div className="my-2.5 border-t border-slate-200/70 mx-1" />

                  {/* 8. Secondary: Home Page */}
                  <button
                    onClick={() => {
                      navigate("/");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all text-[13px] text-slate-700 hover:bg-slate-100 font-medium"
                  >
                    <Home className="mr-3 h-4.5 w-4.5 text-slate-400" />
                    <span>Home Page</span>
                  </button>
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Patient"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Scrollable Viewport Content */}
        <div className={`flex-1 flex flex-col ${activeTab === "chat" ? "overflow-hidden min-h-0" : "overflow-y-auto"}`}>
          {activeTab === "chat" ? (
            <div className="flex-1 min-h-0 h-full relative" key={activeTab}>
              {renderActiveContent()}
            </div>
          ) : (
            <main className="flex-grow p-4 md:p-8 flex flex-col pb-24 md:pb-8">
              {/* Header Banner for non-overview & non-chat tabs */}
              {activeTab !== "overview" && (
                <div className="mb-6 fade-up shrink-0">
                  <p className="section-kicker mb-1">{firstName} · {activePage.eyebrow}</p>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 tracking-tight">
                    {activePage.title}
                  </h1>
                  <p className="mt-1.5 text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">
                    {activePage.description}
                  </p>
                </div>
              )}

              <div className="fade-up" key={activeTab}>
                {renderActiveContent()}
              </div>
            </main>
          )}
        </div>

        {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
        {/* Matches bottom row right mobile views from reference design */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-2 flex items-center justify-around z-30 shadow-lg">
          <button
            onClick={() => handleTabChange("overview")}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === "overview" ? "text-teal-600 font-bold" : "text-slate-400"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </button>

          <button
            onClick={() => handleTabChange("history")}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === "history" ? "text-teal-600 font-bold" : "text-slate-400"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Reports</span>
          </button>

          <button
            onClick={() => handleTabChange("trends")}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === "trends" ? "text-teal-600 font-bold" : "text-slate-400"
            }`}
          >
            <LineChart className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Trends</span>
          </button>

          <button
            onClick={() => handleTabChange("chat")}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === "chat" ? "text-teal-600 font-bold" : "text-slate-400"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Assistant</span>
          </button>

          <button
            onClick={() => handleTabChange("profile")}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === "profile" ? "text-teal-600 font-bold" : "text-slate-400"
            }`}
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Profile</span>
          </button>
        </nav>

      </div>

      {/* Onboarding Intake Questionnaire Wizard Overlay */}
      {(showIntakeRetake || (!!profile && (!profile.intake_responses || !profile.intake_responses.diet))) && (
        <OnboardingIntake 
          onClose={() => setShowIntakeRetake(false)} 
          isRetake={showIntakeRetake} 
        />
      )}
    </div>
  );
};
