import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../hooks/useAuth";
import { X, Sparkles, Send, CheckCircle2, ArrowRight, FileText, RefreshCw, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ================= SOLID AESTHETIC SVG ICONS =================

const SolidHeartPulse: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SolidSparkle: React.FC<{ className?: string }> = ({ className = "h-3 w-3" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
  </svg>
);

const SolidArrowUpRight: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 17.59L15.59 7H9V5h10v10h-2V8.41L6.41 19L5 17.59z" />
  </svg>
);

const SolidUpload: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19h16v2H4zm8-16L7.5 7.5l1.42 1.42L11 6.83V16h2V6.83l2.08 2.09 1.42-1.42L12 3z" />
  </svg>
);

const SolidCpu: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 9h2v2h-2zm0 4h2v2h-2zm-16-4h2v2H3zm0 4h2v2H3zm6-8h2v2H9zm4 0h2v2h-2zM9 19h2v2H9zm4 0h2v2h-2zm-7-4h12V7H6v12zm2-10h8v8H8V5z" />
  </svg>
);

const SolidTrend: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 11h3v8H4zm5.5-4h3v12h-3zm5.5 8h3v4h-3zm5.5-12h3v16h-3z" />
  </svg>
);

const SolidShield: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);

const SolidLayers: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 11.53l-9 7-9-7 1.63-1.26L12 16zm0-11L3 12l9 7 9-7-9-7z" />
  </svg>
);

const SolidScale: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 14.93V19h-2v-2.07a6 6 0 01-5-5.93h2a4 4 0 008 0h2a6 6 0 01-5 5.93z" />
  </svg>
);

const SolidActivity: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.5 11l-3-3-3 3-1.5-1.5L11.5 8l3 3 3.5-3.5L19.5 9l-5 5z" />
  </svg>
);

const SolidPlus: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const SolidMinus: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13H5v-2h14v2z" />
  </svg>
);

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

  // Interactive Pillars State
  const [activeDayIdx, setActiveDayIdx] = useState<number>(3); // Wednesday
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
      status: "Borderline Low",
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
      status: "Deficiency Alert",
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
      status: "Optimal Range",
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
      status: "Borderline High",
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
      navigate(`/login?tab=${tab}&auto=1`);
    }
  };

  const faqData: FAQItem[] = [
    {
      question: "Is HealthLens a medical diagnostic tool?",
      answer: "No, HealthLens is strictly an educational tool designed to help you translate complex laboratory values into easy-to-understand information. It does not provide medical diagnoses, treatment recommendations, or clinical advice."
    },
    {
      question: "How is my health data secured and processed?",
      answer: "We prioritize your privacy. Your uploaded documents are processed securely, and your data is stored in your private, authenticated database. We do not sell, share, or use your health data for training public AI models."
    },
    {
      question: "What types of lab reports are supported?",
      answer: "HealthLens supports most standard PDF and image-based (JPEG/PNG) lab reports, specifically blood panels, metabolic panels, lipid panels, and complete blood counts (CBC)."
    },
    {
      question: "How does the AI biomarker tracking work?",
      answer: "Our system uses optical character recognition (OCR) to extract biomarker names and values from your report. It then normalizes the units and compares them against age- and gender-adjusted reference intervals to visualize your historical trends."
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Hero Entrance Animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      tl.fromTo(
        ".nav-item",
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 }
      );
      
      tl.fromTo(
        ".hero-title-line",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
        "-=0.4"
      );
      
      tl.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.5"
      );
      
      tl.fromTo(
        ".hero-cta",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.5"
      );

      // 2. Ultra-Light Card Scroll Animation
      gsap.fromTo(
        ".clinical-card",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );

      // 3. Workflow Step Entrance Animation
      gsap.fromTo(
        ".workflow-step",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: workflowRef.current,
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      // 4. Features Grid Scroll Animation
      gsap.fromTo(
        ".feature-item",
        { opacity: 0, y: 15 },
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

      // 5. Floating background blobs
      gsap.to(".blob-1", {
        x: "random(-30, 30)",
        y: "random(-30, 30)",
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
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] relative overflow-hidden font-sans flex flex-col justify-between"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 0% 100%, rgba(212, 175, 55, 0.03) 0%, transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(212, 175, 55, 0.03) 0%, transparent 30%),
          radial-gradient(rgba(26, 26, 26, 0.025) 1px, transparent 0)
        `,
        backgroundSize: "100% 100%, 100% 100%, 100% 100%, 24px 24px"
      }}
    >
      {/* Subtle organic noise layer */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.01]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Ambient background glow elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-radial from-[#D4AF37]/4 to-transparent blur-[100px] blob-1" />
        <div className="absolute bottom-[25%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-radial from-[#D4AF37]/3 to-transparent blur-[90px] blob-2" />
      </div>

      {/* Header / Navigation */}
      <header className="w-full max-w-[1300px] mx-auto px-6 py-6 md:py-8 flex justify-between items-center z-10 relative">
        {/* Logo */}
        <div className="flex items-center gap-2.5 text-[#1A1A1A] font-heading font-semibold text-xl tracking-tight cursor-pointer nav-item" onClick={() => navigate("/")}>
          <div className="bg-[#1A1A1A] text-[#FDFBF7] p-1.5 rounded-xl flex items-center justify-center">
            <SolidHeartPulse className="h-3.5 w-3.5 text-[#FDFBF7]" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">HealthLens</span>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#71797E]">
          <a href="#home" className="nav-item text-[#1A1A1A] hover:text-black transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-[#1a1a1a] after:scale-x-100">Home</a>
          <a href="#workflow" className="nav-item hover:text-black transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-[#1a1a1a] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300">How It Works</a>
          <a href="#features" className="nav-item hover:text-black transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-[#1a1a1a] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300">Capabilities</a>
          <a href="#faq" className="nav-item hover:text-black transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-[#1a1a1a] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300">FAQ</a>
        </nav>

        {/* Right CTA */}
        <div className="nav-item flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="hidden md:flex px-4 py-2 text-xs font-semibold text-[#71797E] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate("/login")}
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#B8962D] text-white rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all duration-300 active:scale-[0.97] shadow-md hover:shadow-lg cursor-pointer"
          >
            <span>Try Demo Free</span>
            <SolidArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 relative w-full">
        
        {/* Hero Section */}
        <section id="home" className="text-center space-y-6 max-w-3xl mx-auto px-6 py-12 md:py-20">
          {/* Demo Credentials Banner */}
          <div className="overflow-hidden flex justify-center">
            <div className="hero-title-line inline-flex items-center gap-3 bg-[#FFFDF9] border border-[#D4AF37]/30 rounded-full px-5 py-2.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-[#1A1A1A] tracking-wide">🎯 Live Demo</span>
              <span className="text-[11px] text-[#71797E] font-mono hidden sm:block">demo@healthlens.ai / Demo@12345</span>
              <button
                onClick={handleCTAClick}
                className="text-[10px] font-bold text-[#D4AF37] hover:text-[#B8962D] transition-colors cursor-pointer"
              >
                Try Now →
              </button>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-light text-[#1A1A1A] leading-[1.12] tracking-tight">
            <span className="block hero-title-line">Smarter Health Insights,</span>
            <span className="block hero-title-line italic font-normal text-[#1a1a1a]/90">Powered by AI</span>
          </h1>
          
          <p className="hero-subtitle text-sm md:text-base text-[#71797E] max-w-xl mx-auto leading-relaxed font-light">
            Upload your lab report — our AI instantly decodes every biomarker, tracks your health trends, and answers your questions in plain English.
          </p>
          
          <div className="hero-cta pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              onClick={handleCTAClick}
              className="px-8 py-4 bg-[#1A1A1A] hover:bg-black text-[#FDFBF7] rounded-full text-sm font-bold tracking-wide flex items-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-lg hover:shadow-xl cursor-pointer group"
            >
              <span>Start Analyzing Free</span>
              <SolidArrowUpRight className="h-3.5 w-3.5 text-[#FDFBF7]" />
            </button>
            <span className="text-xs text-[#71797E] font-light">No credit card needed · 100% free</span>
          </div>

          {/* Stats Row */}
          <div className="hero-cta pt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-[#EFECE6] mt-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-semibold text-[#1A1A1A]">20+</div>
              <div className="text-[11px] text-[#71797E] font-light mt-0.5">Biomarkers Tracked</div>
            </div>
            <div className="text-center border-x border-[#EFECE6]">
              <div className="text-2xl font-heading font-semibold text-[#1A1A1A]">AI</div>
              <div className="text-[11px] text-[#71797E] font-light mt-0.5">Powered Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-semibold text-[#1A1A1A]">Free</div>
              <div className="text-[11px] text-[#71797E] font-light mt-0.5">Always & Forever</div>
            </div>
          </div>
        </section>

        {/* 3 Pillars Cards Section */}
        <section 
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1300px] mx-auto px-6 mb-24 md:mb-32"
        >
          
          {/* Card 1: OCR Analysis */}
          <div 
            onClick={() => setActivePillarModal("ocr")}
            className="clinical-card group/card relative min-h-[520px] md:min-h-[560px] rounded-[2.2rem] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-[#EFECE6] bg-[#FFF] flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {/* Background Portrait */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800" 
                alt="Serene Health Analysis" 
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out scale-100 group-hover/card:scale-105 filter brightness-[0.82] contrast-[1.05] saturate-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            </div>

            {/* Top Label & Quick Action Badge */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider text-white/60 uppercase font-mono">Pillar 01</span>
                <h3 className="text-2xl font-heading font-medium text-[#FDFBF7] mt-0.5">OCR Analysis</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 shadow-sm group-hover/card:bg-[#D4AF37] group-hover/card:text-black transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Tap to Scan ↗</span>
              </span>
            </div>

            {/* Translucent Bar Chart Overlay */}
            <div className="z-10 w-full mb-1">
              <div className="glass-card-dark-overlay rounded-3xl p-5 border border-white/15 shadow-xl space-y-3.5 backdrop-blur-xl bg-black/65">
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
                  className="w-full py-2 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C29D29] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>⚡ Try 1-Click OCR Scanner</span>
                  <span className="text-white/80">&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Biomarkers */}
          <div 
            onClick={() => setActivePillarModal("biomarkers")}
            className="clinical-card group/card relative min-h-[520px] md:min-h-[560px] rounded-[2.2rem] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-[#EFECE6] bg-[#FFF] flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {/* Background Portrait */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800" 
                alt="Thoughtful Biomarker Analysis" 
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out scale-100 group-hover/card:scale-105 filter brightness-[0.78] contrast-[1.08] saturate-[0.8]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            </div>

            {/* Top Label & Quick Action Badge */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider text-white/60 uppercase font-mono">Pillar 02</span>
                <h3 className="text-2xl font-heading font-medium text-[#FDFBF7] mt-0.5">Biomarkers</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 shadow-sm group-hover/card:bg-[#D4AF37] group-hover/card:text-black transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Tap to Explore ↗</span>
              </span>
            </div>

            {/* Translucent Biomarker Widget Overlay */}
            <div className="z-10 w-full mb-1">
              <div className="glass-card-dark-overlay rounded-3xl p-5 border border-white/15 shadow-xl space-y-3.5 backdrop-blur-xl bg-black/65">
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
                            ? "bg-[#D4AF37] text-white shadow-sm font-bold scale-105"
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
                        className="w-full py-2 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C29D29] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span>📊 Explore Biomarker Trends</span>
                        <span className="text-white/80">&rarr;</span>
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
            className="clinical-card group/card relative min-h-[520px] md:min-h-[560px] rounded-[2.2rem] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-[#EFECE6] bg-[#FFF] flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {/* Background Portrait */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800" 
                alt="Serene AI Health Assistant" 
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out scale-100 group-hover/card:scale-105 filter brightness-[0.8] contrast-[1.04] saturate-[0.9]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            </div>

            {/* Top Label & Quick Action Badge */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider text-white/60 uppercase font-mono">Pillar 03</span>
                <h3 className="text-2xl font-heading font-medium text-[#FDFBF7] mt-0.5">AI Chatbot</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 shadow-sm group-hover/card:bg-[#D4AF37] group-hover/card:text-black transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Tap to Chat ↗</span>
              </span>
            </div>

            {/* Translucent Chat & Trend Widget Overlay */}
            <div className="z-10 w-full mb-1">
              <div className="glass-card-dark-overlay rounded-3xl p-5 border border-white/15 shadow-xl space-y-3.5 backdrop-blur-xl bg-black/65">
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
                            ? "bg-[#D4AF37] text-white shadow-sm font-bold scale-105"
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
                  className="w-full py-2 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C29D29] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>💬 Ask AI Coach a Question</span>
                  <span className="text-white/80">&rarr;</span>
                </button>
              </div>
            </div>
          </div>

        </section>

        {/* ================= LIVE WORKING PILLAR MODALS ================= */}
        {activePillarModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => { setActivePillarModal(null); setOcrScanStep("idle"); }}
          >
            <div 
              className="relative w-full max-w-2xl bg-[#FCFAF6] border border-[#D4AF37]/40 rounded-[2rem] shadow-2xl overflow-hidden p-6 md:p-8 font-sans max-h-[90vh] overflow-y-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => { setActivePillarModal(null); setOcrScanStep("idle"); }}
                className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* MODAL 1: OCR SCANNER */}
              {activePillarModal === "ocr" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                      ⚡ PILLAR 01: LIVE OCR DEMO
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">Pypdf + Tesseract Engine</span>
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-[#1A1A1A]">
                    OCR Document Analysis & Extraction
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 mb-6 font-light">
                    Experience how HealthLens scans raw PDF reports, detects biomarker tables, and normalizes clinical units.
                  </p>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs mb-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                          <div className="text-xs font-bold text-gray-900">Comprehensive_Metabolic_Panel.pdf</div>
                          <div className="text-[10px] text-gray-500 font-mono">Sample Clinical Lab Panel • Quest Diagnostics</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        ocrScanStep === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {ocrScanStep === "completed" ? "Extracted" : "Ready to Scan"}
                      </span>
                    </div>

                    {ocrScanStep === "idle" && (
                      <div className="py-8 text-center space-y-4">
                        <div className="inline-flex p-3.5 rounded-full bg-[#FFFDF0] border border-[#D4AF37]/30 text-[#D4AF37] shadow-xs">
                          <Sparkles className="w-7 h-7 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">Trigger Multi-Engine OCR Parsing</h4>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 font-light">
                            Extract tabular biomarkers, reference ranges, and abnormal indicators in one click.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={runOcrSimulation}
                          className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8962D] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Run Instant OCR Scan</span>
                        </button>
                      </div>
                    )}

                    {ocrScanStep === "scanning" && (
                      <div className="py-10 text-center space-y-3 relative">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse shadow-[0_0_12px_#D4AF37]" />
                        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
                        <div className="text-xs font-bold text-gray-800">Processing Document Layout & Extracting Text...</div>
                        <div className="text-[10px] font-mono text-gray-500">Normalizing mg/dL, U/L, ng/mL against medical standard</div>
                      </div>
                    )}

                    {ocrScanStep === "completed" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-900">Extraction Complete: 12 Biomarkers Identified</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                            99.8% Precision
                          </span>
                        </div>

                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                          <div className="grid grid-cols-12 bg-gray-50 p-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                            <div className="col-span-5">Biomarker</div>
                            <div className="col-span-3">Result</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Reference</div>
                          </div>
                          {[
                            { name: "Fasting Blood Glucose", val: "92 mg/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", ref: "70 - 99" },
                            { name: "Serum Creatinine", val: "0.9 mg/dL", status: "Normal", color: "text-emerald-700 bg-emerald-50", ref: "0.7 - 1.3" },
                            { name: "Blood Urea Nitrogen (BUN)", val: "14 mg/dL", status: "Normal", color: "text-emerald-700 bg-emerald-50", ref: "7 - 20" },
                            { name: "Alanine Aminotransferase (ALT)", val: "24 U/L", status: "Normal", color: "text-emerald-700 bg-emerald-50", ref: "7 - 56" },
                            { name: "Serum Ferritin (Iron Stores)", val: "10.8 g/dl", status: "Low", color: "text-rose-700 bg-rose-50", ref: "12 - 150" },
                            { name: "25-Hydroxy Vitamin D", val: "19.5 ng/mL", status: "Deficient", color: "text-amber-700 bg-amber-50", ref: "30 - 100" }
                          ].map((row, i) => (
                            <div key={i} className="grid grid-cols-12 p-2 items-center hover:bg-gray-50/60 transition-colors">
                              <div className="col-span-5 font-semibold text-gray-900">{row.name}</div>
                              <div className="col-span-3 font-mono font-bold text-gray-800">{row.val}</div>
                              <div className="col-span-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono ${row.color}`}>
                                  {row.status}
                                </span>
                              </div>
                              <div className="col-span-2 text-right font-mono text-[10px] text-gray-500">{row.ref}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    {ocrScanStep === "completed" && (
                      <button
                        type="button"
                        onClick={runOcrSimulation}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all cursor-pointer text-center"
                      >
                        🔄 Re-scan Demo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setActivePillarModal(null); handlePillarClick("upload"); }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#B8962D] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🚀 Launch Full Workspace & Upload PDF</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL 2: BIOMARKERS */}
              {activePillarModal === "biomarkers" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                      📊 PILLAR 02: BIOMARKER TRACKING
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">Interactive Ranges</span>
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-[#1A1A1A]">
                    Biomarker Trends & Clinical Bounds
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 mb-5 font-light">
                    Select a panel below to test dynamic reference interval tracking and abnormal flag indicators.
                  </p>

                  {/* Category Pills */}
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          biomarkerCategory === tab.id
                            ? "bg-[#D4AF37] text-white shadow-xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Biomarkers List for Selected Category */}
                  <div className="space-y-3 mb-6">
                    {biomarkerCategory === "cmp" && [
                      { name: "Fasting Blood Glucose", val: "92 mg/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", markerPos: "45%", ref: "70 - 99", note: "Healthy glycemic control and insulin sensitivity." },
                      { name: "Serum Creatinine", val: "0.9 mg/dL", status: "Normal", color: "text-emerald-700 bg-emerald-50", markerPos: "50%", ref: "0.7 - 1.3", note: "Adequate renal filtration and kidney health." },
                      { name: "ALT (Liver Enzyme)", val: "24 U/L", status: "Normal", color: "text-emerald-700 bg-emerald-50", markerPos: "35%", ref: "7 - 56", note: "Normal hepatic metabolic activity." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-gray-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-gray-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-emerald-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-gray-600 font-light">{bm.note}</p>
                      </div>
                    ))}

                    {biomarkerCategory === "cbc" && [
                      { name: "Hemoglobin", val: "14.2 g/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", markerPos: "55%", ref: "13.8 - 17.2", note: "Healthy oxygen transport capacity." },
                      { name: "Platelet Count", val: "250 x10^3/uL", status: "Normal", color: "text-emerald-700 bg-emerald-50", markerPos: "48%", ref: "150 - 450", note: "Adequate blood coagulation capability." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-gray-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-gray-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-emerald-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-gray-600 font-light">{bm.note}</p>
                      </div>
                    ))}

                    {biomarkerCategory === "lipid" && [
                      { name: "Total Cholesterol", val: "215 mg/dL", status: "Borderline High", color: "text-rose-700 bg-rose-50", markerPos: "75%", ref: "< 200", note: "Slight elevation. Dietary evaluation recommended." },
                      { name: "HDL (Good) Cholesterol", val: "48 mg/dL", status: "Optimal", color: "text-emerald-700 bg-emerald-50", markerPos: "50%", ref: "> 40", note: "Protective cardiovascular profile." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-gray-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-gray-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-rose-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-gray-600 font-light">{bm.note}</p>
                      </div>
                    ))}

                    {biomarkerCategory === "vitamins" && [
                      { name: "Ferritin (Blood Iron)", val: "10.8 g/dl", status: "Borderline Low", color: "text-rose-700 bg-rose-50", markerPos: "15%", ref: "12 - 150", note: "Depleted iron reserves detected. May cause fatigue." },
                      { name: "Vitamin D (25-OH)", val: "19.5 ng/mL", status: "Deficiency Alert", color: "text-amber-700 bg-amber-50", markerPos: "20%", ref: "30 - 100", note: "Sub-optimal level. Discuss D3 drops with doctor." }
                    ].map((bm, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-900">{bm.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${bm.color}`}>{bm.status}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-mono font-bold text-gray-800">{bm.val}</span>
                          <span className="text-[10px] font-mono text-gray-500">Ref: {bm.ref}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-100 rounded-full" />
                          <div className="absolute top-0 bottom-0 w-2.5 bg-amber-500 rounded-full" style={{ left: bm.markerPos }} />
                        </div>
                        <p className="text-[10.5px] text-gray-600 font-light">{bm.note}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActivePillarModal(null); handlePillarClick("trends"); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#B8962D] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
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
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                      💬 PILLAR 03: LIVE AI CHAT
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">Groq Clinical Engine</span>
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-[#1A1A1A]">
                    HealthLens AI Health Coach
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 mb-4 font-light">
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
                        className="px-2.5 py-1 rounded-full bg-[#FFFDF0] hover:bg-[#D4AF37]/15 text-[10.5px] font-medium text-gray-800 border border-[#D4AF37]/30 transition-all shrink-0 cursor-pointer"
                      >
                        {prompt} ↗
                      </button>
                    ))}
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="h-60 rounded-2xl bg-white border border-gray-200 p-4 overflow-y-auto space-y-3 mb-3 text-xs">
                    {demoChatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-[#D4AF37] text-white font-medium rounded-tr-xs"
                            : "bg-[#F9F8F5] border border-gray-200/80 text-gray-800 rounded-tl-xs font-light leading-relaxed"
                        }`}>
                          {msg.role === "assistant" && (
                            <div className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] font-mono mb-1">
                              HealthLens AI
                            </div>
                          )}
                          <div>{msg.text}</div>
                        </div>
                      </div>
                    ))}
                    {demoChatTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#F9F8F5] border border-gray-200/80 p-3 rounded-2xl text-[11px] text-gray-500 italic flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
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
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#D4AF37] text-xs bg-white"
                    />
                    <button
                      type="submit"
                      disabled={demoChatTyping || !demoChatInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8962D] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => { setActivePillarModal(null); handlePillarClick("chat"); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>💬 Open Full Health Assistant Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workflow / How It Works Section */}
        <section 
          id="workflow" 
          ref={workflowRef}
          className="w-full max-w-[1100px] mx-auto px-6 py-16 md:py-24 border-t border-[#EFECE6] text-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37] font-mono block mb-3">Workflow</span>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-[#1A1A1A] mb-12">
            How HealthLens Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-left">
            {/* Step 1 */}
            <div className="workflow-step space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#1A1A1A] text-[#FDFBF7] rounded-xl flex items-center justify-center">
                  <SolidUpload className="h-5 w-5 text-[#FDFBF7]" />
                </div>
                <span className="text-4xl font-heading text-[#EFECE6] font-semibold">01</span>
              </div>
              <h4 className="text-lg font-semibold text-[#1A1A1A] pt-2">Upload Reports</h4>
              <p className="text-sm text-[#71797E] font-light leading-relaxed">
                Securely drop your PDF scans or image-based laboratory reports. Files are handled with bank-grade encryption.
              </p>
            </div>

            {/* Step 2 */}
            <div className="workflow-step space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#1A1A1A] text-[#FDFBF7] rounded-xl flex items-center justify-center">
                  <SolidCpu className="h-5 w-5 text-[#FDFBF7]" />
                </div>
                <span className="text-4xl font-heading text-[#EFECE6] font-semibold">02</span>
              </div>
              <h4 className="text-lg font-semibold text-[#1A1A1A] pt-2">AI Extraction</h4>
              <p className="text-sm text-[#71797E] font-light leading-relaxed">
                Our OCR engine parses the document, normalizes varying units, and maps metrics directly to standard reference ranges.
              </p>
            </div>

            {/* Step 3 */}
            <div className="workflow-step space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#1A1A1A] text-[#FDFBF7] rounded-xl flex items-center justify-center">
                  <SolidTrend className="h-5 w-5 text-[#FDFBF7]" />
                </div>
                <span className="text-4xl font-heading text-[#EFECE6] font-semibold">03</span>
              </div>
              <h4 className="text-lg font-semibold text-[#1A1A1A] pt-2">Analyze & Consult</h4>
              <p className="text-sm text-[#71797E] font-light leading-relaxed">
                Visualize historical biomarker graphs and discuss findings securely with an empathetic RAG AI assistant.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Features Grid Section */}
        <section 
          id="features" 
          ref={featuresRef}
          className="w-full bg-[#FAF7F1] border-t border-b border-[#EFECE6] py-16 md:py-24"
        >
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37] font-mono block mb-3">Core Capabilities</span>
              <h2 className="text-3xl md:text-4xl font-heading font-light text-[#1A1A1A]">
                Intelligent Medical Translation
              </h2>
              <p className="text-sm text-[#71797E] font-light mt-4 leading-relaxed">
                We bridge the gap between complex laboratory statistics and actionable personal wellness metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="feature-item p-6 bg-[#FFFDF9] border border-[#EFECE6] rounded-[1.8rem] space-y-3 shadow-xs hover:border-[#D4AF37]/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <SolidShield className="h-4 w-4 text-[#FDFBF7]" />
                </div>
                <h5 className="font-semibold text-[#1A1A1A] text-sm">Privacy-First Data</h5>
                <p className="text-xs text-[#71797E] font-light leading-relaxed">
                  Your data stays in your private Supabase container. We never share or sell your sensitive medical records.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-item p-6 bg-[#FFFDF9] border border-[#EFECE6] rounded-[1.8rem] space-y-3 shadow-xs hover:border-[#D4AF37]/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <SolidLayers className="h-4 w-4 text-[#FDFBF7]" />
                </div>
                <h5 className="font-semibold text-[#1A1A1A] text-sm">Chronological Timelines</h5>
                <p className="text-xs text-[#71797E] font-light leading-relaxed">
                  Track how your biomarkers change over weeks, months, or years. Spot health patterns before they become issues.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-item p-6 bg-[#FFFDF9] border border-[#EFECE6] rounded-[1.8rem] space-y-3 shadow-xs hover:border-[#D4AF37]/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <SolidScale className="h-4 w-4 text-[#FDFBF7]" />
                </div>
                <h5 className="font-semibold text-[#1A1A1A] text-sm">Unit Normalization</h5>
                <p className="text-xs text-[#71797E] font-light leading-relaxed">
                  Different labs use different units. Our parser automatically normalizes metrics (e.g., pg/mL to ng/dL) for clean comparison.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-item p-6 bg-[#FFFDF9] border border-[#EFECE6] rounded-[1.8rem] space-y-3 shadow-xs hover:border-[#D4AF37]/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <SolidActivity className="h-4 w-4 text-[#FDFBF7]" />
                </div>
                <h5 className="font-semibold text-[#1A1A1A] text-sm">Reference Range Matching</h5>
                <p className="text-xs text-[#71797E] font-light leading-relaxed">
                  Compare results against age- and biological sex-adjusted healthy intervals sourced from medical reference databases.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="feature-item p-6 bg-[#FFFDF9] border border-[#EFECE6] rounded-[1.8rem] space-y-3 shadow-xs hover:border-[#D4AF37]/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <SolidSparkle className="h-4 w-4 text-[#FDFBF7]" />
                </div>
                <h5 className="font-semibold text-[#1A1A1A] text-sm">Empathetic AI RAG</h5>
                <p className="text-xs text-[#71797E] font-light leading-relaxed">
                  Ask questions and get answers grounded in peer-reviewed medical publications and your historical lab data.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="feature-item p-6 bg-[#FFFDF9] border border-[#EFECE6] rounded-[1.8rem] space-y-3 shadow-xs hover:border-[#D4AF37]/40 transition-colors duration-300">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <SolidHeartPulse className="h-4 w-4 text-[#FDFBF7]" />
                </div>
                <h5 className="font-semibold text-[#1A1A1A] text-sm">Health Index Scoring</h5>
                <p className="text-xs text-[#71797E] font-light leading-relaxed">
                  Receive a consolidated, high-level health index rating based on the status of your primary metabolic and blood biomarkers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section 
          id="faq" 
          ref={faqRef}
          className="w-full max-w-[800px] mx-auto px-6 py-16 md:py-24"
        >
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37] font-mono block mb-3">FAQ</span>
            <h2 className="text-3xl font-heading font-light text-[#1A1A1A]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="border border-[#EFECE6] bg-[#FFFDF9] rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-[#FAF7F1]/40 transition-colors"
                  >
                    <span className="font-medium text-sm md:text-base text-[#1A1A1A]">{faq.question}</span>
                    <span className="text-[#D4AF37] shrink-0">
                      {isOpen ? <SolidMinus className="h-3.5 w-3.5" /> : <SolidPlus className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-40 border-t border-[#EFECE6]" : "max-h-0"
                    }`}
                  >
                    <div className="px-6 py-5 text-xs md:text-sm text-[#71797E] font-light leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1300px] mx-auto px-6 py-8 mt-4 border-t border-[#EFECE6] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#71797E] z-10 relative">
        <span>© 2026 HealthLens. All rights reserved.</span>
        <span className="italic font-light text-center sm:text-right">
          Educational platform only. Not intended for professional medical diagnosis or clinical treatment.
        </span>
      </footer>
    </div>
  );
};
