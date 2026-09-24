import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../hooks/useAuth";
import { 
  X, 
  Sparkles, 
  Send, 
  ArrowRight, 
  FileText, 
  HeartPulse, 
  Upload, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Scale, 
  Activity, 
  Plus, 
  Minus,
  CheckCircle2,
  RefreshCw,
  Zap
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  question: string;
  answer: string;
}

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive Pillars State (Image 2)
  const [activeDayIdx, setActiveDayIdx] = useState<number>(3); // Wednesday (78%)
  const [activeBiomarkerIdx, setActiveBiomarkerIdx] = useState<number>(0); // Ferritin
  const [activeChatPromptIdx, setActiveChatPromptIdx] = useState<number>(0); // Chat prompt

  // Pillar Working Live Demo Modals
  const [activePillarModal, setActivePillarModal] = useState<"ocr" | "biomarkers" | "chat" | null>(null);
  const [ocrScanStep, setOcrScanStep] = useState<"idle" | "scanning" | "completed">("idle");
  const [biomarkerCategory, setBiomarkerCategory] = useState<"cmp" | "cbc" | "lipid" | "vitamins">("cmp");
  const [demoChatMessages, setDemoChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hello! I am your HealthLens Clinical AI Assistant. Ask me anything about your lab biomarkers, reference intervals, or health insights." }
  ]);
  const [demoChatInput, setDemoChatInput] = useState("");
  const [demoChatTyping, setDemoChatTyping] = useState(false);

  const runOcrSimulation = () => {
    setOcrScanStep("scanning");
    setTimeout(() => {
      setOcrScanStep("completed");
    }, 1100);
  };

  const handleSendDemoChat = (textToSend?: string) => {
    const q = (textToSend || demoChatInput).trim();
    if (!q || demoChatTyping) return;
    
    const updated = [...demoChatMessages, { role: "user" as const, text: q }];
    setDemoChatMessages(updated);
    setDemoChatInput("");
    setDemoChatTyping(true);

    setTimeout(() => {
      let answer = "Based on clinical reference intervals, maintaining balanced nutrition with periodic check-ups is recommended.";
      const lower = q.toLowerCase();
      if (lower.includes("ferritin") || lower.includes("iron")) {
        answer = "Ferritin reflects your body's iron stores. A reading of 10.8 g/dL is borderline low, indicating depleted storage before frank anemia develops. Consider iron-rich foods (spinach, lentils) paired with Vitamin C to maximize absorption.";
      } else if (lower.includes("vitamin d") || lower.includes("vit d")) {
        answer = "A Vitamin D reading of 19.5 ng/mL indicates deficiency (optimal range: 30-100 ng/mL). 15-20 minutes of sunlight and discussing a 2,000 IU daily D3 supplement with your physician can restore optimal levels.";
      } else if (lower.includes("glucose") || lower.includes("sugar")) {
        answer = "Fasting glucose at 92 mg/dL is within the clinically optimal reference range (70-99 mg/dL). This demonstrates healthy insulin sensitivity and metabolic stability.";
      } else if (lower.includes("cholesterol") || lower.includes("lipid")) {
        answer = "Total cholesterol of 215 mg/dL is borderline elevated (<200 mg/dL target). Focus on soluble fiber, omega-3s, and regular aerobic exercise for cardiovascular health.";
      }
      setDemoChatMessages([...updated, { role: "assistant" as const, text: answer }]);
      setDemoChatTyping(false);
    }, 600);
  };

  const ocrDays = [
    { label: "S", val: 64, count: 8, confidence: 99.2 },
    { label: "M", val: 74, count: 12, confidence: 99.6 },
    { label: "T", val: 57, count: 9, confidence: 98.9 },
    { label: "W", val: 78, count: 16, confidence: 99.8 },
    { label: "Th", val: 68, count: 11, confidence: 99.4 },
    { label: "F", val: 56, count: 10, confidence: 99.1 },
    { label: "S", val: 65, count: 14, confidence: 99.5 }
  ];

  const sampleBiomarkers = [
    {
      id: "ferritin",
      name: "Ferritin (Blood Iron)",
      short: "Ferritin",
      val: "10.8",
      unit: "g/dl",
      status: "BORDERLINE LOW",
      color: "#FF4D6D",
      badgeBg: "rgba(220, 20, 60, 0.2)",
      badgeBorder: "rgba(220, 20, 60, 0.35)",
      ref: "12.0 - 150.0",
      markerPos: "15%",
      markerColor: "#EF4444",
      desc: "Low iron stores detected. Dietary heme iron review suggested."
    },
    {
      id: "vitd",
      name: "Vitamin D (25-OH)",
      short: "Vit D",
      val: "19.5",
      unit: "ng/mL",
      status: "DEFICIENCY ALERT",
      color: "#FBBF24",
      badgeBg: "rgba(245, 158, 11, 0.2)",
      badgeBorder: "rgba(245, 158, 11, 0.35)",
      ref: "30.0 - 100.0",
      markerPos: "20%",
      markerColor: "#F59E0B",
      desc: "Sub-optimal vitamin D level. Consider safe sun exposure or supplementation."
    },
    {
      id: "glucose",
      name: "Fasting Blood Glucose",
      short: "Glucose",
      val: "92",
      unit: "mg/dL",
      status: "OPTIMAL RANGE",
      color: "#4DFFC9",
      badgeBg: "rgba(16, 185, 129, 0.2)",
      badgeBorder: "rgba(16, 185, 129, 0.35)",
      ref: "70.0 - 99.0",
      markerPos: "55%",
      markerColor: "#10B981",
      desc: "Healthy insulin sensitivity & steady glucose regulation."
    },
    {
      id: "cholesterol",
      name: "Total Cholesterol",
      short: "Lipid",
      val: "215",
      unit: "mg/dL",
      status: "BORDERLINE HIGH",
      color: "#F87171",
      badgeBg: "rgba(239, 68, 68, 0.2)",
      badgeBorder: "rgba(239, 68, 68, 0.35)",
      ref: "< 200.0",
      markerPos: "75%",
      markerColor: "#EF4444",
      desc: "Slight elevation. Cardiovascular lifestyle check recommended."
    }
  ];

  const aiChatPrompts = [
    {
      label: "Iron Stores",
      q: "What does 10.8 g/dl Ferritin mean?",
      a: "10.8 g/dL reflects low iron storage before anemia. Recommended: increase iron-rich foods & pair with Vitamin C."
    },
    {
      label: "Vit D Tips",
      q: "How can I improve my Vitamin D?",
      a: "Spend 15-20 min in morning sunlight. Add fatty fish, eggs, or consult your GP about 2,000 IU D3 drops."
    },
    {
      label: "Glucose Check",
      q: "Is 92 mg/dL fasting glucose healthy?",
      a: "Yes! 92 mg/dL is within the optimal fasting zone (<100 mg/dL), showing well-regulated glycemic metabolism."
    }
  ];

  const handlePillarClick = (tab: "upload" | "trends" | "chat") => {
    if (user) {
      navigate(`/dashboard?tab=${tab}`);
    } else {
      navigate(`/login?tab=${tab}`);
    }
  };

  const faqData: FAQItem[] = [
    {
      question: "Is HealthLens a medical diagnostic tool?",
      answer: "No, HealthLens is strictly an educational tool designed to help you translate complex laboratory values into easy-to-understand information. It does not provide medical diagnoses, treatment recommendations, or clinical advice."
    },
    {
      question: "How are my uploaded laboratory reports protected?",
      answer: "All reports and extracted biomarkers are encrypted at rest and in transit. Your records reside in your isolated Supabase container with Row Level Security (RLS) ensuring strict personal access control."
    },
    {
      question: "What lab report formats are supported?",
      answer: "HealthLens supports all standard PDF lab reports (Quest, LabCorp, Dr Lal PathLabs, SRL, Metropolis) as well as clear smartphone photos or scans in PNG and JPEG formats."
    },
    {
      question: "Can I track changes in my biomarkers over time?",
      answer: "Yes! Each time you upload a new lab report, HealthLens automatically normalizes the biomarkers and plots them along an interactive chronological timeline with reference ranges."
    },
    {
      question: "How does the AI Health Assistant use my data?",
      answer: "The assistant uses Retrieval-Augmented Generation (RAG) to search solely within your own verified lab results and established clinical guidelines, providing contextual explanations without hallucinations."
    }
  ];

  // GSAP Smooth Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Text Entrance
      gsap.from(".hero-title-line", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out"
      });

      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.3,
        ease: "power2.out"
      });

      gsap.from(".hero-cta", {
        opacity: 0,
        y: 15,
        duration: 0.7,
        delay: 0.45,
        ease: "power2.out"
      });

      // 2. Clinical 3 Pillar Cards Animation
      if (cardsRef.current) {
        gsap.fromTo(
          ".clinical-card",
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // 4. Workflow Step Entrance Animation
      if (workflowRef.current) {
        gsap.fromTo(
          ".workflow-step",
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: workflowRef.current,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // 5. Features Grid Scroll Animation
      if (featuresRef.current) {
        gsap.fromTo(
          ".feature-item",
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // 6. Floating ambient background blobs
      gsap.to(".blob-1", {
        x: "random(-25, 25)",
        y: "random(-25, 25)",
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".blob-2", {
        x: "random(-20, 20)",
        y: "random(-20, 20)",
        duration: 14,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCTAClick = () => {
    if (user) {
      navigate("/dashboard?tab=upload");
    } else {
      navigate("/login?mode=signup");
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-[#FDFBF7] text-[#0F172A] relative overflow-hidden font-sans flex flex-col justify-between"
      style={{
        backgroundColor: "#FDFBF7",
        backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.025) 1px, transparent 0)",
        backgroundSize: "24px 24px",
        backgroundRepeat: "repeat"
      }}
    >
      {/* Subtle organic SVG noise layer */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Ambient background glow elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[6%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-teal-500/[0.03] blur-[120px] blob-1" />
        <div className="absolute top-[12%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-teal-500/[0.02] blur-[100px] blob-2" />
      </div>

      {/* Header / Navigation */}
      <header className="w-full max-w-[1360px] mx-auto px-6 py-6 md:py-8 flex justify-between items-center z-10 relative">
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <div className="h-9 w-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shadow-md shadow-teal-700/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">HealthLens AI</span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-semibold text-slate-600">
          <a href="#home" className="text-slate-900 font-bold border-b-2 border-[#0D9488] pb-1 transition-colors">Home</a>
          <a href="#pillars" className="hover:text-teal-700 transition-colors pb-1">Pillars</a>
          <a href="#workflow" className="hover:text-teal-700 transition-colors pb-1">How It Works</a>
          <a href="#faq" className="hover:text-teal-700 transition-colors pb-1">FAQ</a>
        </nav>

        {/* Right Nav Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="hidden md:flex px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate("/login?auto=1")}
            className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0B7A70] text-white rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all duration-300 active:scale-[0.97] shadow-md hover:shadow-lg cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Try Demo Free</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 relative w-full">
        
        {/* ================= HERO SECTION (LIGHT HEALTHLENS ATMOSPHERE) ================= */}
        <section id="home" className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-12 md:pb-24">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ===== LEFT COLUMN: EDITORIAL HERO CONTENT (approx 45% width) ===== */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              
              {/* Pill Kicker */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#E6F4F1] border border-[#B2DFDB] text-[#0D9488] text-xs font-semibold shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#0D9488]" />
                <span className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider font-bold">AI-POWERED HEALTH INSIGHTS</span>
              </div>

              {/* Editorial Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-[#0B1528] leading-[1.08] sm:leading-[1.04] tracking-tight">
                <span className="block hero-title-line">Smarter Health</span>
                <span className="block hero-title-line">Insights,</span>
                <span className="block hero-title-line text-[#0D9488]">
                  Powered by AI
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="hero-subtitle text-sm sm:text-lg text-slate-600 font-light leading-relaxed max-w-xl">
                Upload your lab report — our AI instantly decodes every biomarker, tracks your health trends, and answers your questions in plain English.
              </p>

              {/* Primary & Secondary CTA Buttons */}
              <div className="hero-cta pt-2 sm:pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                <button 
                  onClick={handleCTAClick}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#0D9488] hover:bg-[#0B7A70] text-white text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-teal-900/15 hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer group"
                >
                  <span>Start Analyzing Free</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </button>

                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  No credit card needed · 100% free
                </span>
              </div>

            </div>

            {/* ===== RIGHT COLUMN: LARGE ANATOMICAL VISUAL + FLOATING BIOMARKER CARDS (approx 55% width) ===== */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[300px] sm:min-h-[460px] lg:min-h-[580px]">
              
              {/* Soft Ambient Teal Radial Glow behind anatomical figure */}
              <div className="absolute inset-0 bg-radial from-teal-400/20 via-teal-300/5 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              {/* Subtle Concentric Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[260px] h-[260px] sm:w-[420px] sm:h-[420px] rounded-full border border-teal-500/10 animate-pulse" />
                <div className="absolute w-[360px] h-[360px] sm:w-[560px] sm:h-[560px] rounded-full border border-teal-500/5" />
              </div>

              {/* Anatomy Hero Illustration */}
              <div className="relative z-10 w-full max-w-[340px] sm:max-w-[560px] lg:max-w-[620px] flex items-center justify-center">
                <img 
                  src="/hero_anatomy.png" 
                  alt="HealthLens Anatomical Intelligence" 
                  className="w-full h-auto object-contain mix-blend-multiply select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(13,148,136,0.15)] transform hover:scale-[1.01] transition-transform duration-500"
                />
              </div>

              {/* Floating Biomarker Card 1: Lipid Profile (Top Right, near shoulder/neck) */}
              <div 
                onClick={() => navigate(user ? "/dashboard?tab=trends" : "/login?tab=trends")}
                className="absolute top-2 sm:top-8 right-0 sm:right-2 z-20 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 border border-slate-200/90 shadow-[0_15px_35px_rgba(0,0,0,0.08)] backdrop-blur-md max-w-[155px] sm:max-w-[210px] w-full transition-all duration-300 hover:scale-105 cursor-pointer animate-float-slow"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                    <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Lipid Profile</span>
                  </div>
                  <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                    HIGH
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-2xl font-extrabold font-mono text-slate-900 leading-none">198</span>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400">mg/dL</span>
                </div>
                <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-normal mt-0.5 sm:mt-1 truncate">Total Cholesterol</p>
              </div>

              {/* Floating Biomarker Card 2: Vitamin D (Bottom Left, near lower ribs/waist) */}
              <div 
                onClick={() => navigate(user ? "/dashboard?tab=trends" : "/login?tab=trends")}
                className="absolute bottom-2 sm:bottom-10 left-0 sm:left-4 z-20 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 border border-slate-200/90 shadow-[0_15px_35px_rgba(0,0,0,0.08)] backdrop-blur-md max-w-[155px] sm:max-w-[210px] w-full transition-all duration-300 hover:scale-105 cursor-pointer animate-float-slower"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                    <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Vitamin D</span>
                  </div>
                  <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    LOW
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-2xl font-extrabold font-mono text-slate-900 leading-none">14.2</span>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400">ng/mL</span>
                </div>
                <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-normal mt-0.5 sm:mt-1 truncate">25-OH Vitamin D</p>
              </div>

            </div>

          </div>

          {/* ===== BOTTOM FEATURE STRIP ===== */}
          <div className="pt-8 mt-14 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#E6F4F1] border border-[#B2DFDB]/60 flex items-center justify-center text-[#0D9488] shrink-0 shadow-xs">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">20+</p>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Biomarkers Tracked</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#E6F4F1] border border-[#B2DFDB]/60 flex items-center justify-center text-[#0D9488] shrink-0 shadow-xs">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">AI</p>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Powered Analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#E6F4F1] border border-[#B2DFDB]/60 flex items-center justify-center text-[#0D9488] shrink-0 shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Free</p>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Always & Forever</p>
              </div>
            </div>

          </div>

        </section>



        {/* ================= 3 INTERACTIVE LUXURY PILLARS (IMAGE 2) ================= */}
        <section 
          id="pillars"
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1300px] mx-auto px-6 mb-24 md:mb-32"
        >
          
          {/* Card 1: OCR Analysis */}
          <div 
            onClick={() => setActivePillarModal("ocr")}
            className="clinical-card group/card relative min-h-[520px] md:min-h-[560px] rounded-[2.2rem] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-200 bg-white flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {/* Background Portrait */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800" 
                alt="OCR Analysis" 
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out scale-100 group-hover/card:scale-105 filter brightness-[0.82] contrast-[1.05] saturate-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
            </div>

            {/* Top Label & Quick Action Badge */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider text-white/60 uppercase font-mono">Pillar 01</span>
                <h3 className="text-2xl font-heading font-medium text-[#FDFBF7] mt-0.5">OCR Analysis</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 shadow-sm group-hover/card:bg-[#D4AF37] group-hover/card:text-black transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Tap to Scan ↗</span>
              </span>
            </div>

            {/* Translucent Bar Chart Overlay */}
            <div className="z-10 w-full mb-1">
              <div className="rounded-3xl p-5 border border-white/15 shadow-xl space-y-3.5 backdrop-blur-xl bg-black/70">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-white/95 font-sans tracking-wide">Report Parsing</span>
                    <span className="ml-2 text-[10px] font-mono text-white/50">Tap a day</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-mono">
                    {ocrDays[activeDayIdx].confidence}% ACC
                  </span>
                </div>
                
                {/* Bar Chart Graphics - Clickable Bars */}
                <div className="flex justify-between items-end h-20 pt-1 px-1">
                  {ocrDays.map((item, idx) => {
                    const isSelected = activeDayIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDayIdx(idx);
                        }}
                        className={`flex flex-col items-center gap-1.5 flex-1 transition-all group/bar cursor-pointer ${
                          isSelected ? "scale-105" : "opacity-75 hover:opacity-100"
                        }`}
                        title={`Day ${item.label}: ${item.count} biomarkers (${item.confidence}% ACC)`}
                      >
                        <span className={`text-[9px] font-mono transition-colors ${
                          isSelected ? "text-[#D4AF37] font-bold" : "text-white/60"
                        }`}>
                          {item.val}%
                        </span>
                        <div className={`w-3 h-12 rounded-full overflow-hidden relative flex items-end transition-all ${
                          isSelected 
                            ? "bg-white/20 ring-2 ring-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                            : "bg-white/5 hover:bg-white/10"
                        }`}>
                          <div 
                            className={`w-full rounded-full transition-all duration-300 ${
                              isSelected
                                ? "bg-gradient-to-t from-[#D4AF37] to-[#FFF8E7]"
                                : "bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37]"
                            }`}
                            style={{ height: `${item.val}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold font-sans transition-colors ${
                          isSelected ? "text-[#D4AF37] font-bold" : "text-white/50"
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10.5px] text-white/80 text-center font-light leading-snug">
                  Day <span className="font-semibold text-[#D4AF37]">{ocrDays[activeDayIdx].label}</span>: Extracted <span className="font-semibold text-white">{ocrDays[activeDayIdx].count} biomarkers</span> with <span className="font-semibold text-[#D4AF37]">{ocrDays[activeDayIdx].confidence}%</span> confidence.
                </div>

                {/* 1-Click Launch Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePillarModal("ocr");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C29D29] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>⚡ Try 1-Click OCR Scanner</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Biomarkers */}
          <div 
            onClick={() => setActivePillarModal("biomarkers")}
            className="clinical-card group/card relative min-h-[520px] md:min-h-[560px] rounded-[2.2rem] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-200 bg-white flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {/* Background Portrait */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800" 
                alt="Biomarker Trends" 
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out scale-100 group-hover/card:scale-105 filter brightness-[0.78] contrast-[1.08] saturate-[0.8]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
            </div>

            {/* Top Label & Quick Action Badge */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider text-white/60 uppercase font-mono">Pillar 02</span>
                <h3 className="text-2xl font-heading font-medium text-[#FDFBF7] mt-0.5">Biomarkers</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 shadow-sm group-hover/card:bg-[#D4AF37] group-hover/card:text-black transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Tap to Explore ↗</span>
              </span>
            </div>

            {/* Translucent Biomarker Widget Overlay */}
            <div className="z-10 w-full mb-1">
              <div className="rounded-3xl p-5 border border-white/15 shadow-xl space-y-3.5 backdrop-blur-xl bg-black/70">
                {/* Interactive Biomarker Toggle Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {sampleBiomarkers.map((bm, idx) => {
                    const isSelected = activeBiomarkerIdx === idx;
                    return (
                      <button
                        key={bm.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBiomarkerIdx(idx);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-[#D4AF37] text-black shadow-sm font-bold scale-105"
                            : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
                        }`}
                      >
                        {bm.short}
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const currentBm = sampleBiomarkers[activeBiomarkerIdx];
                  return (
                    <>
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[26px] font-mono font-bold text-white leading-none tracking-tight">
                            {currentBm.val} <span className="text-xs font-normal text-white/60 font-sans">{currentBm.unit}</span>
                          </span>
                          <p className="text-xs font-medium text-white/70 tracking-wide font-sans">{currentBm.name}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <span 
                            className="text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full font-mono transition-all"
                            style={{
                              backgroundColor: currentBm.badgeBg,
                              border: `1px solid ${currentBm.badgeBorder}`,
                              color: currentBm.color
                            }}
                          >
                            {currentBm.status}
                          </span>
                          <p className="text-[9.5px] font-medium text-white/40 font-sans">Ref: {currentBm.ref}</p>
                        </div>
                      </div>

                      {/* Slider with dynamic pointer */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-white/40">
                          <span>Low</span>
                          <span>Normal</span>
                          <span>High</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-white/20 rounded-full" />
                          <div 
                            className="absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-500 shadow-md"
                            style={{ 
                              left: currentBm.markerPos, 
                              backgroundColor: currentBm.markerColor,
                              boxShadow: `0 0 10px ${currentBm.markerColor}`
                            }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10.5px] text-white/80 text-center font-light leading-snug">
                        {currentBm.desc}
                      </div>

                      {/* 1-Click Launch Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePillarModal("biomarkers");
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C29D29] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span>📊 Explore Biomarker Trends</span>
                        <span>&rarr;</span>
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Card 3: AI Chatbot */}
          <div 
            onClick={() => setActivePillarModal("chat")}
            className="clinical-card group/card relative min-h-[520px] md:min-h-[560px] rounded-[2.2rem] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-200 bg-white flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {/* Background Portrait */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800" 
                alt="AI Chatbot Coach" 
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out scale-100 group-hover/card:scale-105 filter brightness-[0.8] contrast-[1.04] saturate-[0.9]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
            </div>

            {/* Top Label & Quick Action Badge */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider text-white/60 uppercase font-mono">Pillar 03</span>
                <h3 className="text-2xl font-heading font-medium text-[#FDFBF7] mt-0.5">AI Chatbot</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 shadow-sm group-hover/card:bg-[#D4AF37] group-hover/card:text-black transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Tap to Chat ↗</span>
              </span>
            </div>

            {/* Translucent Chat & Trend Widget Overlay */}
            <div className="z-10 w-full mb-1">
              <div className="rounded-3xl p-5 border border-white/15 shadow-xl space-y-3.5 backdrop-blur-xl bg-black/70">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white/95 font-sans tracking-wide">AI Health Coach</span>
                  <span className="text-[10px] font-bold text-[#4DFFC9] bg-[#4DFFC9]/15 border border-[#4DFFC9]/30 px-2 py-0.5 rounded-full font-mono">
                    OPTIMAL 86/100
                  </span>
                </div>

                {/* Question Suggestion Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {aiChatPrompts.map((item, idx) => {
                    const isSelected = activeChatPromptIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChatPromptIdx(idx);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-[#D4AF37] text-black shadow-sm font-bold scale-105"
                            : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* AI Dialogue Box */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                    <span>AI Consultation Insight</span>
                  </div>
                  <p className="text-[10.5px] text-white/90 leading-snug font-light">
                    "{aiChatPrompts[activeChatPromptIdx].a}"
                  </p>
                </div>

                {/* 1-Click Launch Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePillarModal("chat");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C29D29] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>💬 Ask AI Coach a Question</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>

        </section>

        {/* ================= LIVE WORKING PILLAR MODALS ================= */}
        {activePillarModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => { setActivePillarModal(null); setOcrScanStep("idle"); }}
          >
            <div 
              className="relative w-full max-w-2xl bg-[#FCFAF6] border border-[#D4AF37]/40 rounded-[2rem] shadow-2xl overflow-hidden p-6 md:p-8 font-sans max-h-[90vh] overflow-y-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => { setActivePillarModal(null); setOcrScanStep("idle"); }}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* MODAL 1: OCR SCANNER */}
              {activePillarModal === "ocr" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#9E7A1C] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                      ⚡ PILLAR 01: LIVE OCR DEMO
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">Pypdf + Tesseract Engine</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900">
                    OCR Document Analysis & Extraction
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 mb-6 font-light">
                    Test our medical parser with a sample lab report to witness instant biomarker extraction.
                  </p>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs mb-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Sample_Comprehensive_Metabolic_Panel.pdf</p>
                          <p className="text-[10px] text-slate-400 font-mono">248 KB · 16 Biomarkers Detected</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        Ready
                      </span>
                    </div>

                    {ocrScanStep === "idle" && (
                      <button
                        type="button"
                        onClick={runOcrSimulation}
                        className="w-full py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Run Instant OCR Scan Simulation</span>
                      </button>
                    )}

                    {ocrScanStep === "scanning" && (
                      <div className="py-6 text-center space-y-3">
                        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                        <p className="text-xs font-medium text-slate-700">Extracting text & identifying medical entities...</p>
                        <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full animate-pulse w-3/4" />
                        </div>
                      </div>
                    )}

                    {ocrScanStep === "completed" && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Successfully extracted 16 clinical biomarkers with 99.8% confidence.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-mono">Fasting Glucose</span>
                            <span className="font-bold text-slate-800 font-mono">92 mg/dL</span> (Normal)
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-mono">Serum Ferritin</span>
                            <span className="font-bold text-rose-600 font-mono">10.8 g/dL</span> (Borderline)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActivePillarModal(null); handlePillarClick("upload"); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>⚡ Open Full Lab Report Uploader</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* MODAL 2: BIOMARKERS */}
              {activePillarModal === "biomarkers" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#9E7A1C] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                      📊 PILLAR 02: LIVE BIOMARKER TRACKER
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">TanStack Query + Recharts</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900">
                    Comprehensive Biomarker Normalization
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 mb-4 font-light">
                    Select a panel category to inspect clinical metrics, healthy reference intervals, and alerts.
                  </p>

                  {/* Category Tabs */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {[
                      { id: "cmp", label: "Metabolic (CMP)" },
                      { id: "cbc", label: "Complete Blood (CBC)" },
                      { id: "lipid", label: "Lipid Profile" },
                      { id: "vitamins", label: "Vitamins & Minerals" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBiomarkerCategory(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          biomarkerCategory === tab.id
                            ? "bg-[#0D9488] text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Biomarkers List for Selected Category */}
                  <div className="space-y-3 mb-6">
                    {biomarkerCategory === "cmp" && [
                      { name: "Fasting Blood Glucose", val: "92 mg/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", markerPos: "45%", ref: "70 - 99", note: "Healthy glycemic control and insulin sensitivity." },
                      { name: "Serum Creatinine", val: "0.9 mg/dL", status: "Normal", color: "text-emerald-700 bg-emerald-50", markerPos: "50%", ref: "0.7 - 1.3", note: "Adequate renal filtration and kidney health." },
                      { name: "ALT (Liver Enzyme)", val: "24 U/L", status: "Normal", color: "text-emerald-700 bg-emerald-50", markerPos: "35%", ref: "7 - 56", note: "Normal hepatic metabolic activity." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-slate-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-slate-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-emerald-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-light">{bm.note}</p>
                      </div>
                    ))}

                    {biomarkerCategory === "cbc" && [
                      { name: "Hemoglobin", val: "14.2 g/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", markerPos: "55%", ref: "13.8 - 17.2", note: "Healthy oxygen transport capacity." },
                      { name: "Platelet Count", val: "250 x10^3/uL", status: "Normal", color: "text-emerald-700 bg-emerald-50", markerPos: "48%", ref: "150 - 450", note: "Adequate blood coagulation capability." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-slate-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-slate-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-emerald-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-light">{bm.note}</p>
                      </div>
                    ))}

                    {biomarkerCategory === "lipid" && [
                      { name: "Total Cholesterol", val: "215 mg/dL", status: "Borderline High", color: "text-rose-700 bg-rose-50", markerPos: "75%", ref: "< 200", note: "Slight elevation. Dietary evaluation recommended." },
                      { name: "HDL (Good) Cholesterol", val: "48 mg/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", markerPos: "50%", ref: "> 40", note: "Protective cardiovascular profile." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-slate-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-slate-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-rose-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-light">{bm.note}</p>
                      </div>
                    ))}

                    {biomarkerCategory === "vitamins" && [
                      { name: "Ferritin (Blood Iron)", val: "10.8 g/dl", status: "Borderline Low", color: "text-rose-700 bg-rose-50", markerPos: "15%", ref: "12 - 150", note: "Depleted iron reserves detected. May cause fatigue." },
                      { name: "Vitamin D (25-OH)", val: "19.5 ng/mL", status: "Deficiency Alert", color: "text-amber-700 bg-amber-50", markerPos: "20%", ref: "30 - 100", note: "Sub-optimal level. Discuss D3 drops with doctor." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-slate-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-slate-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-amber-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-light">{bm.note}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActivePillarModal(null); handlePillarClick("trends"); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📊 Open Full Biomarker Trends Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* MODAL 3: AI CHATBOT */}
              {activePillarModal === "chat" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#9E7A1C] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                      💬 PILLAR 03: LIVE AI CHAT
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">Groq Clinical Engine</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900">
                    HealthLens AI Health Coach
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 mb-4 font-light">
                    Ask real questions or tap the prompt pills below to test immediate clinical explanations.
                  </p>

                  {/* Suggestion Chips */}
                  <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                    {[
                      "What causes low Ferritin?",
                      "How to improve Vitamin D?",
                      "Is 92 mg/dL glucose safe?",
                      "Tips for high Cholesterol"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendDemoChat(prompt)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 text-[10.5px] font-medium text-slate-800 border border-slate-200 transition-all shrink-0 cursor-pointer"
                      >
                        {prompt} ↗
                      </button>
                    ))}
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="h-60 rounded-2xl bg-white border border-slate-200 p-4 overflow-y-auto space-y-3 mb-3 text-xs">
                    {demoChatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-[#0D9488] text-white font-medium rounded-tr-xs"
                            : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs font-light leading-relaxed"
                        }`}>
                          {msg.role === "assistant" && (
                            <div className="text-[9px] font-bold uppercase tracking-wider text-teal-700 font-mono mb-1">
                              HealthLens AI
                            </div>
                          )}
                          <div>{msg.text}</div>
                        </div>
                      </div>
                    ))}
                    {demoChatTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-[11px] text-slate-500 italic flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                          HealthLens AI is analyzing clinical data...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendDemoChat(); }}
                    className="flex gap-2 mb-4"
                  >
                    <input
                      type="text"
                      value={demoChatInput}
                      onChange={(e) => setDemoChatInput(e.target.value)}
                      placeholder="Ask about your lab tests, diet, or symptoms..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 text-xs bg-white"
                    />
                    <button
                      type="submit"
                      disabled={demoChatTyping || !demoChatInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => { setActivePillarModal(null); handlePillarClick("chat"); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>💬 Open Full Health Assistant Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= WORKFLOW / HOW IT WORKS SECTION ================= */}
        <section 
          id="workflow" 
          ref={workflowRef}
          className="w-full max-w-[1100px] mx-auto px-6 py-16 md:py-24 border-t border-slate-200/80 text-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700 font-mono block mb-3">Workflow</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-12">
            How HealthLens Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-left">
            {/* Step 1 */}
            <div className="workflow-step space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <span className="text-4xl font-heading text-slate-200 font-bold">01</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 pt-2">Upload Reports</h4>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Securely drop your PDF scans or image-based laboratory reports. Files are handled with bank-grade encryption.
              </p>
            </div>

            {/* Step 2 */}
            <div className="workflow-step space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                  <Cpu className="h-5 w-5 text-white" />
                </div>
                <span className="text-4xl font-heading text-slate-200 font-bold">02</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 pt-2">AI Extraction</h4>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Our OCR engine parses the document, normalizes varying units, and maps metrics directly to standard reference ranges.
              </p>
            </div>

            {/* Step 3 */}
            <div className="workflow-step space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-4xl font-heading text-slate-200 font-bold">03</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 pt-2">Analyze & Consult</h4>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Visualize historical biomarker graphs and discuss findings securely with an empathetic RAG AI assistant.
              </p>
            </div>
          </div>
        </section>

        {/* ================= DETAILED FEATURES GRID SECTION ================= */}
        <section 
          id="features" 
          ref={featuresRef}
          className="w-full py-16 md:py-24"
        >
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700 font-mono block mb-3">Core Capabilities</span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                Intelligent Medical Translation
              </h2>
              <p className="text-sm text-slate-600 font-light mt-4 leading-relaxed">
                We bridge the gap between complex laboratory statistics and actionable personal wellness metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="feature-item p-6 bg-white border border-slate-200 rounded-[1.8rem] space-y-3 shadow-xs hover:border-teal-500/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <h5 className="font-semibold text-slate-900 text-sm">Privacy-First Data</h5>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Your data stays in your private Supabase container. We never share or sell your sensitive medical records.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-item p-6 bg-white border border-slate-200 rounded-[1.8rem] space-y-3 shadow-xs hover:border-teal-500/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <h5 className="font-semibold text-slate-900 text-sm">Chronological Timelines</h5>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Track how your biomarkers change over weeks, months, or years. Spot health patterns before they become issues.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-item p-6 bg-white border border-slate-200 rounded-[1.8rem] space-y-3 shadow-xs hover:border-teal-500/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Scale className="h-4 w-4 text-white" />
                </div>
                <h5 className="font-semibold text-slate-900 text-sm">Unit Normalization</h5>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Different labs use different units. Our parser automatically normalizes metrics (e.g., pg/mL to ng/dL) for clean comparison.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-item p-6 bg-white border border-slate-200 rounded-[1.8rem] space-y-3 shadow-xs hover:border-teal-500/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <h5 className="font-semibold text-slate-900 text-sm">Reference Range Matching</h5>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Compare results against age- and biological sex-adjusted healthy intervals sourced from medical reference databases.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="feature-item p-6 bg-white border border-slate-200 rounded-[1.8rem] space-y-3 shadow-xs hover:border-teal-500/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h5 className="font-semibold text-slate-900 text-sm">Empathetic AI RAG</h5>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Ask questions and get answers grounded in peer-reviewed medical publications and your historical lab data.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="feature-item p-6 bg-white border border-slate-200 rounded-[1.8rem] space-y-3 shadow-xs hover:border-teal-500/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <HeartPulse className="h-4 w-4 text-white" />
                </div>
                <h5 className="font-semibold text-slate-900 text-sm">Health Index Scoring</h5>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Receive a consolidated, high-level health index rating based on the status of your primary metabolic and blood biomarkers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section 
          id="faq" 
          ref={faqRef}
          className="w-full max-w-[800px] mx-auto px-6 py-16 md:py-24"
        >
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700 font-mono block mb-3">FAQ</span>
            <h2 className="text-3xl font-heading font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="border border-slate-200 bg-white rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-sm md:text-base text-slate-900">{faq.question}</span>
                    <span className="text-teal-700 shrink-0">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-40 border-t border-slate-100" : "max-h-0"
                    }`}
                  >
                    <div className="px-6 py-5 text-xs md:text-sm text-slate-600 font-light leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full max-w-[1300px] mx-auto px-6 py-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 z-10 relative">
        <span>© 2026 HealthLens AI. All rights reserved.</span>
        <span className="italic font-light text-center sm:text-right">
          Educational platform only. Not intended for professional medical diagnosis or clinical treatment.
        </span>
      </footer>
    </div>
  );
};
