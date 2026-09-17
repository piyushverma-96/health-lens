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
  UploadCloud
} from "lucide-react";
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
  const initialTab = searchParams.get("tab") || "chat";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatPreload, setChatPreload] = useState<string | null>(null);
  const [showIntakeRetake, setShowIntakeRetake] = useState(false);

  const navigation = [
    { id: "chat", name: "Health Assistant", icon: MessageSquare },
    { id: "upload", name: "Upload Report", icon: UploadCloud },
    { id: "history", name: "Report History", icon: LayoutDashboard },
    { id: "trends", name: "Biomarker Trends", icon: LineChart },
    { id: "memory", name: "Health Memory", icon: Database },
    { id: "profile", name: "My Profile", icon: UserIcon },
  ];

  const pageMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
    chat: {
      eyebrow: "Guidance",
      title: "Ask better questions about your health data.",
      description: "Use the assistant to translate lab values into plain language and next-step conversations.",
    },
    upload: {
      eyebrow: "Analysis",
      title: "Upload lab tests, images, or clinical panels.",
      description: "Analyze blood work images (.png, .jpg), PDFs, or test with 1-click synthetic demo reports.",
    },
    history: {
      eyebrow: "Review",
      title: "Inspect every report with more clarity.",
      description: "Revisit extracted biomarkers, summaries, and document status without digging through old files.",
    },
    trends: {
      eyebrow: "Trends",
      title: "See change over time, not just isolated numbers.",
      description: "Track biomarker movement in a calmer visual system built for patterns, not noise.",
    },
    memory: {
      eyebrow: "Memory",
      title: "Keep context across your health story.",
      description: "Surface persistent facts and patterns so the app becomes more useful with every report.",
    },
    profile: {
      eyebrow: "Profile",
      title: "Tune the experience around you.",
      description: "Update intake information and preferences so insights stay personal and relevant.",
    },
  };

  const activePage = pageMeta[activeTab] ?? pageMeta.chat;
  const firstName = profile?.first_name || user?.email?.split("@")[0] || "there";

  const renderActiveContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <HealthAssistant 
            preloadedPrompt={chatPreload} 
            onClearPreload={() => setChatPreload(null)} 
            onNavigate={(tabId) => setActiveTab(tabId)}
          />
        );
      case "upload":
        return (
          <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 animate-fade-in">
            <ReportUploader onUploadSuccess={() => setActiveTab("history")} />
          </div>
        );
      case "history":
        return (
          <ReportHistory 
            onAskMore={(name, value, unit) => {
              setChatPreload(`Tell me more about my ${name} result of ${value} ${unit}.`);
              setActiveTab("chat");
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
    <div className="min-h-screen bg-[#FDFBF7] text-clinical-slate font-sans flex relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_52%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-white/50 blur-3xl" />

      {/* Global Grain SVG Noise Layer */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col justify-between h-screen sticky top-0 bg-white/80 backdrop-blur-md border-r border-gold-border/80 transition-all duration-300 z-30 shrink-0 ${
          sidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Sidebar Header / Brand */}
          <div className={`p-5 flex items-center justify-between border-b border-gold-border/60 h-20 shrink-0 ${!sidebarExpanded ? "justify-center" : ""}`}>
            {sidebarExpanded ? (
              <div 
                className="flex items-center gap-3 text-gold-leaf text-lg font-bold tracking-tight font-heading cursor-pointer active:scale-[0.98]"
                onClick={() => navigate("/")}
                title="Go to Home Page"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gold-border shadow-sm">
                  <HeartPulse className="h-4.5 w-4.5 text-gold-leaf animate-pulse" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold">HealthLens</span>
                  <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-gray-400 mt-0.5">Clinical Workspace</span>
                </div>
              </div>
            ) : (
              <div 
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gold-border shadow-sm cursor-pointer active:scale-[0.98]"
                onClick={() => navigate("/")}
                title="Go to Home Page"
              >
                <HeartPulse className="h-4.5 w-4.5 text-gold-leaf animate-pulse" />
              </div>
            )}

            {/* Toggle Button */}
            {sidebarExpanded && (
              <button 
                onClick={() => setSidebarExpanded(false)}
                className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gold-leaf rounded-lg transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-3 space-y-1.5 flex-grow">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer group ${
                    sidebarExpanded ? "px-4 py-3 text-left" : "p-3.5 justify-center"
                  } ${
                    isActive
                      ? "bg-gold-leaf/10 text-gold-leaf border border-gold-leaf/20 shadow-xs font-semibold"
                      : "text-clinical-slate hover:bg-gold-leaf/5 hover:text-gold-leaf border border-transparent"
                  }`}
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 ${sidebarExpanded ? "mr-3" : ""}`} />
                  {sidebarExpanded && <span className="text-xs uppercase tracking-wider font-bold text-[10.5px]">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User & Logout) */}
        <div className="p-4 border-t border-gold-border/60 bg-[#FAF9F6]/40 shrink-0">
          {/* Expand Button when collapsed */}
          {!sidebarExpanded && (
            <div className="flex justify-center mb-4">
              <button 
                onClick={() => setSidebarExpanded(true)}
                className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-gold-leaf rounded-lg transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className={`flex items-center justify-between gap-2 ${!sidebarExpanded ? "flex-col" : ""}`}>
            {sidebarExpanded ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 rounded-full bg-gold-leaf text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-clinical-slate truncate">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : "User"}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
            ) : (
              <div 
                className="h-9 w-9 rounded-full bg-gold-leaf text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
                onClick={() => setActiveTab("profile")}
                title="My Profile"
              >
                {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
              </div>
            )}

            <button
              onClick={signOut}
              className={`p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gold-border rounded-xl transition-all duration-200 active:scale-[0.95] shadow-xs cursor-pointer ${
                sidebarExpanded ? "" : "mt-2"
              }`}
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden glass-topbar h-16 px-4 flex items-center justify-between gap-4 shrink-0 z-20 relative">
          {/* Left: Menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-clinical-slate hover:text-gold-leaf rounded-lg transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Middle: Logo (Centered absolutely) */}
          <div 
            className="flex items-center gap-2 text-gold-leaf text-md font-bold tracking-tight font-heading cursor-pointer active:scale-[0.98] absolute left-1/2 -translate-x-1/2"
            onClick={() => navigate("/")}
            title="Go to Home Page"
          >
            <HeartPulse className="h-5 w-5 text-gold-leaf animate-pulse" />
            <span className="text-sm font-bold">HealthLens</span>
          </div>

          {/* Right: Empty spacer to balance the header layout */}
          <div className="w-8"></div>
        </header>

        {/* Mobile Menu Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer */}
            <aside className="relative w-72 max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col justify-between z-10 animate-slide-in-left">
              <div className="flex flex-col flex-grow overflow-y-auto">
                {/* Header with Close button */}
                <div className="flex items-center justify-between pb-4 border-b border-gold-border/60">
                  <div 
                    className="flex items-center gap-3 text-gold-leaf text-lg font-bold tracking-tight font-heading cursor-pointer active:scale-[0.98]"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/");
                    }}
                    title="Go to Home Page"
                  >
                    <HeartPulse className="h-5 w-5 text-gold-leaf animate-pulse" />
                    <span>HealthLens</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gold-leaf rounded-lg cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="py-4 space-y-2 flex-grow">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          isActive
                            ? "bg-gold-leaf/10 text-gold-leaf border border-gold-leaf/20 font-semibold"
                            : "text-clinical-slate hover:bg-gold-leaf/5 hover:text-gold-leaf border border-transparent"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        <span className="text-xs uppercase tracking-wider font-bold">{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gold-border/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gold-leaf text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-clinical-slate truncate">
                        {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : "User"}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gold-border rounded-xl transition-all duration-200 active:scale-[0.95] shadow-xs cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Content Container (Scrollable) */}
        <div className={`flex-1 flex flex-col ${activeTab === "chat" ? "overflow-hidden min-h-0" : "overflow-y-auto justify-between"}`}>
          {activeTab === "chat" ? (
            /* For Chat/Health Assistant, occupy 100% space with no wrapper margins or paddings */
            <div className="flex-1 min-h-0 h-full relative" key={activeTab}>
              {renderActiveContent()}
            </div>
          ) : (
            <main className="flex-grow p-4 md:p-6 flex flex-col">
              {/* Show Header Banner only for non-chat tabs */}
              <div className="mb-6 fade-up shrink-0 px-2">
                <p className="section-kicker mb-1">Welcome back, {firstName}</p>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-[--color-stone-ink] tracking-tight">
                  {activePage.title}
                </h1>
                <p className="mt-2 text-xs md:text-sm text-[--color-stone-soft] leading-relaxed max-w-2xl">
                  {activePage.description}
                </p>
              </div>

              <div className="fade-up" key={activeTab}>
                {renderActiveContent()}
              </div>
            </main>
          )}
        </div>
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

