import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { 
  HeartPulse, 
  Loader2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTab = searchParams.get("tab");
  const redirectTarget = targetTab ? `/dashboard?tab=${targetTab}` : "/dashboard";
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Profile Data (for SignUp)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("B+");
  
  const { isMockMode, mockLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("auto") === "1") {
      setEmail("demo@healthlens.ai");
      setPassword("Demo@12345");
      const autoLog = async () => {
        setLoading(true);
        try {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: "demo@healthlens.ai",
            password: "Demo@12345",
          });
          if (signInErr) {
            // Fallback to mock session
            mockLogin("demo@healthlens.ai", {
              first_name: "Piyush",
              last_name: "Verma",
              date_of_birth: "1995-04-12",
              gender: "male",
              height: "175",
              blood_group: "B+"
            });
          }
          navigate(redirectTarget);
        } catch {
          mockLogin("demo@healthlens.ai", {
            first_name: "Piyush",
            last_name: "Verma",
            date_of_birth: "1995-04-12",
            gender: "male",
            height: "175",
            blood_group: "B+"
          });
          navigate(redirectTarget);
        } finally {
          setLoading(false);
        }
      };
      autoLog();
    }
  }, [searchParams]);

  const handleDemoClick = () => {
    setLoading(true);
    setTimeout(() => {
      mockLogin("demo@healthlens.ai", {
        first_name: "Piyush",
        last_name: "Verma",
        date_of_birth: "1995-04-12",
        gender: "male",
        height: "175",
        blood_group: "B+",
        intake_responses: {
          primary_goals: ["cardiovascular_support", "metabolic_optimization", "energy_improvement"],
          diet: "balanced",
          activity_level: "moderate",
          sleep_hours: "7_8",
          tobacco_alcohol: "rarely",
          family_history: ["diabetes", "hypertension"]
        }
      });
      setLoading(false);
      navigate("/dashboard");
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // If demo account entered manually
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === "demo@healthlens.ai" || normalizedEmail.startsWith("demo")) {
      handleDemoClick();
      return;
    }

    // Mock Mode Fallback if Supabase URL is placeholder
    if (isMockMode) {
      setTimeout(() => {
        try {
          if (isSignUp) {
            mockLogin(email, {
              first_name: firstName || "Piyush",
              last_name: lastName || "Verma",
              date_of_birth: dob || "1995-04-12",
              gender: gender,
              height: height || "175",
              blood_group: bloodGroup
            });
          } else {
            mockLogin(email, {
              first_name: "Piyush",
              last_name: "Verma"
            });
          }
          setLoading(false);
          navigate("/dashboard");
        } catch (err: any) {
          setError(err.message || "Login failed.");
          setLoading(false);
        }
      }, 500);
      return;
    }

    try {
      if (isSignUp) {
        const cleanEmail = email.trim().toLowerCase();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              date_of_birth: dob || null,
              gender: gender,
              height: height || null,
              blood_group: bloodGroup
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData?.user) {
          try {
            await supabase.from("profiles").update({
              height: height || null,
              blood_group: bloodGroup
            }).eq("id", signUpData.user.id);
          } catch (profileErr) {
            console.error("Non-fatal profile sync error:", profileErr);
          }
        }

        if (signUpData?.session) {
          navigate(redirectTarget);
          return;
        }

        setInfoMessage("Account created! Please verify your email inbox/spam to confirm your account before signing in, or disable 'Confirm email' in your Supabase Dashboard for direct access.");
        setIsSignUp(false);
      } else {
        const cleanEmail = email.trim().toLowerCase();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (signInError) {
          if (signInError.message?.toLowerCase().includes("invalid login credentials")) {
            throw new Error("Invalid email or password. Please verify the spelling of your email address or check your password.");
          }
          if (signInError.message?.toLowerCase().includes("email not confirmed")) {
            throw new Error("Email confirm nahi hui hai! Kripya apna email inbox (aur spam folder) check karein aur verification link pe click karein. Agar aap direct login chahte hain to Supabase dashboard mein 'Confirm email' disable kar dein.");
          }
          throw signInError;
        }
        navigate(redirectTarget);
      }
    } catch (err: any) {
      setError(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Subtle organic SVG noise texture */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]" xmlns="http://www.w3.org/2000/svg">
        <filter id="loginNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#loginNoise)" />
      </svg>

      {/* Main Split-Screen Container matching reference image */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] z-10 relative">
        
        {/* ================= LEFT EDITORIAL ART PANEL ================= */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0F1E36] via-[#102A45] to-[#0A1628] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Mountain / Horizon Radial Art */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tag */}
          <div 
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 cursor-pointer relative z-10"
          >
            <div className="h-9 w-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <HeartPulse className="h-5 w-5 animate-pulse" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-white">HealthLens AI</span>
          </div>

          {/* Middle Editorial Typography matching reference */}
          <div className="my-10 space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold leading-tight text-white tracking-tight">
              Small steps <br />
              towards a <br />
              <span className="text-teal-400">healthier you.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-mono tracking-wider uppercase">
              Track. Understand. Improve.
            </p>
          </div>

          {/* Bottom Social Proof Metrics Strip */}
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-teal-300 uppercase tracking-wider block">Better Insights</span>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white">+120K</p>
              <span className="text-[10px] text-slate-400">Reports Analyzed</span>
            </div>
            <div className="space-y-1 border-l border-white/10 pl-4">
              <span className="text-[10px] font-mono text-teal-300 uppercase tracking-wider block">Trusted Care</span>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white">+50K</p>
              <span className="text-[10px] text-slate-400">Happy Users</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT AUTH FORM PANEL ================= */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <span className="font-heading font-bold text-sm text-slate-900">HealthLens AI</span>
              </div>

              <button
                type="button"
                onClick={handleDemoClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 hover:bg-teal-100 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3 w-3 text-teal-600" />
                <span>Try Demo Free</span>
              </button>
            </div>

            <div className="space-y-1.5 mb-6">
              <h3 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                {isSignUp ? "Create your health account" : "Welcome back!"}
              </h3>
              <p className="text-xs text-slate-500">
                {isSignUp 
                  ? "Set up your medical intelligence profile in under 2 minutes." 
                  : "Sign in to access your personal health dashboard."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sign Up Specific Fields */}
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Piyush"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Verma"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 175"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                      >
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="O+">O+</option>
                        <option value="AB+">AB+</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              {!isSignUp && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please use the 'Try Demo Free' button or contact support."); }} className="text-teal-700 hover:underline font-medium">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Submit Buttons Row: Main Action + Side-by-Side Demo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{isSignUp ? "Create Health Profile" : "Sign in"}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDemoClick}
                  className="w-full py-3 px-4 rounded-xl bg-teal-50 hover:bg-teal-100/90 text-teal-800 border border-teal-200/90 text-xs font-bold uppercase tracking-wider shadow-xs hover:shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  <span>Try Demo Free</span>
                </button>
              </div>

            </form>

          </div>

          {/* Bottom Switch between Sign In / Sign Up */}
          <div className="pt-6 border-t border-slate-100 mt-6 text-center text-xs text-slate-500">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
