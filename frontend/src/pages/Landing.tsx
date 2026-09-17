import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../hooks/useAuth";

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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".nav-item", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 });
      tl.fromTo(".hero-title-line", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, "-=0.4");
      tl.fromTo(".hero-subtitle", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5");
      tl.fromTo(".hero-cta", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.5");

      gsap.fromTo(".clinical-card", { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: cardsRef.current, start: "top 88%", toggleActions: "play none none none" }
      });

      gsap.fromTo(".workflow-step", { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
        scrollTrigger: { trigger: workflowRef.current, start: "top 85%", toggleActions: "play none none none" }
      });

      gsap.fromTo(".feature-item", { opacity: 0, y: 25 }, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: featuresRef.current, start: "top 85%", toggleActions: "play none none none" }
      });

      gsap.to(".blob-1", { x: "random(-40, 40)", y: "random(-40, 40)", duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".blob-2", { x: "random(-30, 30)", y: "random(-30, 30)", duration: 18, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".blob-3", { x: "random(-20, 20)", y: "random(-20, 20)", duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCTAClick = () => {
    if (user) navigate("/dashboard");
    else navigate("/login");
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-white relative overflow-hidden font-sans flex flex-col"
      style={{ background: "linear-gradient(135deg, #07070F 0%, #0D0B1E 50%, #070F18 100%)" }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="blob-1 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="blob-2 absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="blob-3 absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)", filter: "blur(100px)" }} />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* ========= NAVBAR ========= */}
      <header className="w-full max-w-[1300px] mx-auto px-6 py-5 flex justify-between items-center z-20 relative">
        <div className="nav-item flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">HealthLens <span className="text-purple-400 font-light">AI</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
          {["#home", "#workflow", "#features", "#faq"].map((href, i) => (
            <a key={i} href={href}
              className="nav-item hover:text-white transition-colors duration-200"
            >{["Home", "How It Works", "Capabilities", "FAQ"][i]}</a>
          ))}
        </nav>

        <div className="nav-item flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="hidden md:block text-sm font-medium text-white/50 hover:text-white transition-colors cursor-pointer">
            Sign In
          </button>
          <button onClick={() => navigate("/login")}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-300 active:scale-95 cursor-pointer shadow-lg"
            style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
            Try Demo Free →
          </button>
        </div>
      </header>

      {/* ========= HERO ========= */}
      <main className="flex-1 flex flex-col items-center z-10 relative w-full">
        <section id="home" className="text-center w-full max-w-4xl mx-auto px-6 pt-16 pb-20">

          {/* Live badge */}
          <div className="hero-title-line flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border text-sm font-semibold"
              style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.3)", color: "#A78BFA" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🎯 Live Demo — demo@healthlens.ai / Demo@12345
              <button onClick={handleCTAClick} className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer">Try Now →</button>
            </div>
          </div>

          {/* Hero title */}
          <h1 className="font-heading font-bold leading-[1.08] tracking-tight mb-6">
            <span className="block hero-title-line text-5xl sm:text-6xl md:text-7xl text-white">Your Lab Reports,</span>
            <span className="block hero-title-line text-5xl sm:text-6xl md:text-7xl"
              style={{ background: "linear-gradient(135deg, #A78BFA 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Decoded by AI
            </span>
          </h1>

          <p className="hero-subtitle text-lg text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Upload any blood report — our AI instantly explains every biomarker in plain English,
            tracks your health trends, and answers your questions 24/7.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button onClick={handleCTAClick}
              className="px-8 py-4 rounded-full text-base font-bold text-white transition-all duration-300 active:scale-95 cursor-pointer shadow-2xl"
              style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}>
              ✨ Start Analyzing Free
            </button>
            <span className="text-sm text-white/30 font-light">No signup required for demo · 100% Free</span>
          </div>

          {/* Stats */}
          <div className="hero-cta grid grid-cols-3 gap-px max-w-md mx-auto rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { num: "20+", label: "Biomarkers" },
              { num: "AI", label: "Powered" },
              { num: "Free", label: "Forever" }
            ].map((s, i) => (
              <div key={i} className="py-5 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-2xl font-heading font-bold"
                  style={{ background: "linear-gradient(135deg, #A78BFA, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {s.num}
                </div>
                <div className="text-[11px] text-white/40 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ========= 3 PILLARS ========= */}
        <section ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-[1300px] mx-auto px-6 mb-24">
          {[
            {
              label: "Pillar 01", title: "Smart OCR", badge: "99.8% ACC",
              img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&q=80&w=800",
              desc: "AI-powered OCR extracts every biomarker from your PDF or image lab report with 99.8% accuracy.",
              color: "#7C3AED"
            },
            {
              label: "Pillar 02", title: "Biomarker Analysis", badge: "REAL-TIME",
              img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
              desc: "Each value is compared against age & gender-adjusted ranges. Color-coded risk indicators make it instant.",
              color: "#06B6D4"
            },
            {
              label: "Pillar 03", title: "AI Health Chat", badge: "OPTIMAL",
              img: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&q=80&w=800",
              desc: "Ask anything about your results. Our RAG-powered AI gives grounded answers from medical literature.",
              color: "#10B981"
            }
          ].map((card, i) => (
            <div key={i}
              className="clinical-card group relative h-[420px] md:h-[480px] rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2"
              style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: `0 0 40px ${card.color}15` }}>
              {/* Background image */}
              <div className="absolute inset-0">
                <img src={card.img} alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: "brightness(0.4) saturate(0.7)" }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(7,7,15,0.98) 0%, rgba(7,7,15,0.5) 50%, transparent 100%)` }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to top, ${card.color}22 0%, transparent 60%)` }} />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">{card.label}</span>
                  <h3 className="text-2xl font-heading font-bold text-white mt-1">{card.title}</h3>
                </div>

                {/* Glass bottom card */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white/80">Live Indicator</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono"
                      style={{ background: `${card.color}25`, color: card.color, border: `1px solid ${card.color}40` }}>
                      {card.badge}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full rounded-full transition-all duration-1000 group-hover:w-full"
                      style={{ width: "75%", background: `linear-gradient(90deg, ${card.color}, ${card.color}88)`, boxShadow: `0 0 10px ${card.color}80` }} />
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ========= HOW IT WORKS ========= */}
        <section id="workflow" ref={workflowRef}
          className="w-full py-20 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-[1100px] mx-auto px-6 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] font-mono mb-3 block"
              style={{ background: "linear-gradient(135deg, #A78BFA, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Workflow
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">How HealthLens Works</h2>
            <p className="text-white/40 text-sm max-w-lg mx-auto mb-16">Three simple steps to transform confusing lab numbers into clear health insights.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {[
                { icon: "📄", step: "01", title: "Upload Your Report", desc: "Drop any PDF or image lab report. Supports CBC, lipid panels, metabolic panels, thyroid, and more.", color: "#7C3AED" },
                { icon: "🤖", step: "02", title: "AI Extraction & Analysis", desc: "Tesseract OCR reads every value. Groq AI interprets each biomarker against medical reference ranges.", color: "#06B6D4" },
                { icon: "📊", step: "03", title: "Insights & Chat", desc: "Get visual trend charts and ask your personal AI health assistant anything about your results.", color: "#10B981" }
              ].map((s, i) => (
                <div key={i} className="workflow-step p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                      {s.icon}
                    </div>
                    <span className="text-5xl font-heading font-bold" style={{ color: `${s.color}20` }}>{s.step}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{s.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========= FEATURES ========= */}
        <section id="features" ref={featuresRef} className="w-full max-w-[1100px] mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] font-mono mb-3 block"
              style={{ background: "linear-gradient(135deg, #A78BFA, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Core Capabilities
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-white/40 text-sm max-w-lg mx-auto">A complete health intelligence platform built for everyone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🔒", title: "Privacy-First", desc: "Your data stays in your private container. We never share your medical records.", color: "#7C3AED" },
              { icon: "📈", title: "Trend Tracking", desc: "Track biomarkers across months and years. Spot patterns before they become problems.", color: "#06B6D4" },
              { icon: "⚖️", title: "Unit Normalization", desc: "Different labs, different units — our AI normalizes everything automatically.", color: "#10B981" },
              { icon: "🎯", title: "Reference Ranges", desc: "Age & gender-adjusted healthy intervals from medical databases.", color: "#F59E0B" },
              { icon: "🧠", title: "RAG-Powered AI", desc: "Answers grounded in peer-reviewed medical publications and your lab history.", color: "#EC4899" },
              { icon: "💊", title: "Health Scoring", desc: "Consolidated health index rating based on all your key biomarkers.", color: "#8B5CF6" }
            ].map((f, i) => (
              <div key={i}
                className="feature-item p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group cursor-default"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}40`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h5 className="font-bold text-white text-sm mb-2">{f.title}</h5>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========= FAQ ========= */}
        <section id="faq" className="w-full max-w-[800px] mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] font-mono mb-3 block"
              style={{ background: "linear-gradient(135deg, #A78BFA, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              FAQ
            </span>
            <h2 className="text-3xl font-heading font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isOpen ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}` }}>
                  <button onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <span className="font-semibold text-sm md:text-base text-white/90">{faq.question}</span>
                    <span className="text-purple-400 shrink-0 text-xl">{isOpen ? "−" : "+"}</span>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-48" : "max-h-0"}`}>
                    <div className="px-6 py-4 text-sm text-white/50 leading-relaxed border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========= CTA BANNER ========= */}
        <section className="w-full max-w-[1100px] mx-auto px-6 pb-20">
          <div className="relative rounded-[2rem] overflow-hidden p-10 text-center"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.15) 100%)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(circle at 30% 50%, rgba(124,58,237,0.4), transparent 60%), radial-gradient(circle at 70% 50%, rgba(6,182,212,0.3), transparent 60%)" }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Ready to understand your health?</h2>
              <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">Join thousands of people taking control of their health with AI-powered insights.</p>
              <button onClick={handleCTAClick}
                className="px-10 py-4 rounded-full text-base font-bold text-white transition-all duration-300 active:scale-95 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}>
                Get Started — It's Free ✨
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========= FOOTER ========= */}
      <footer className="w-full max-w-[1300px] mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs z-10 relative"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>© 2026 HealthLens AI — All rights reserved</span>
        </div>
        <span className="italic text-center">Educational platform only. Not intended for medical diagnosis.</span>
      </footer>
    </div>
  );
};
