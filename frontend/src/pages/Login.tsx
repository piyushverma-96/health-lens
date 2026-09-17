import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { HeartPulse, Loader2 } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Profile Data (for SignUp)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("unknown");
  const [height, setHeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("unknown");
  
  const { isMockMode, mockLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock Mode Authentication Fallback
    if (isMockMode) {
      setTimeout(() => {
        try {
          if (isSignUp) {
            mockLogin(email, {
              first_name: firstName,
              last_name: lastName,
              date_of_birth: dob || null,
              gender: gender,
              height: height || null,
              blood_group: bloodGroup
            });
          } else {
            mockLogin(email);
          }
          setLoading(false);
          navigate("/");
        } catch (err: any) {
          setError(err.message || "Mock login failed.");
          setLoading(false);
        }
      }, 800); // Small delay to feel organic
      return;
    }

    try {
      if (isSignUp) {
        // Sign up with Supabase and pass user profile metadata
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              date_of_birth: dob || null,
              gender: gender,
              height: height || null,
              blood_group: bloodGroup
            }
          }
        });

        if (signUpError) throw signUpError;
        
        // Since trigger public.handle_new_user does not populate height/blood_group directly,
        // perform manual update if user session returns immediately
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
        
        setError("Account created! You can now log in.");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #07070F 0%, #0D0B1E 50%, #070F18 100%)" }}>

      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Back to home */}
      <div className="absolute top-6 left-6 z-10">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
          ← Back to Home
        </button>
      </div>

      {/* Logo + heading */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthLens <span className="font-light" style={{ color: "#A78BFA" }}>AI</span>
          </span>
        </div>
        <h2 className="text-2xl font-heading font-bold text-white">
          {isSignUp ? "Create your health profile" : "Access your health timeline"}
        </h2>
        <p className="mt-2 text-sm italic" style={{ color: "rgba(255,255,255,0.35)" }}>
          "Educational health intelligence at your fingertips"
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="py-8 px-4 sm:px-10 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
          <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Demo Credentials Card */}
          {!isSignUp && (
            <div className="mb-2 p-4 rounded-2xl" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide">🎯 Hackathon Demo — Try Instantly</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(167,139,250,0.8)" }}>Email</div>
                  <div className="text-xs font-mono font-semibold text-white select-all">demo@healthlens.ai</div>
                </div>
                <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(167,139,250,0.8)" }}>Password</div>
                  <div className="text-xs font-mono font-semibold text-white select-all">Demo@12345</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setEmail("demo@healthlens.ai"); setPassword("Demo@12345"); }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
              >
                ✨ Auto-fill Demo Credentials
              </button>
            </div>
          )}

          {isMockMode && (
            <div className="p-3 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200">
              <span className="font-semibold block mb-0.5">Mock Mode Active</span>
              No Supabase config found. Sign in or register with any credentials to preview the app shell.
            </div>
          )}


            {error && (
              <div className={`p-3 rounded-xl text-sm font-medium ${error.includes("created") ? "text-emerald-400" : "text-red-400"}`}
                style={{ background: error.includes("created") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${error.includes("created") ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                {[{id:"first_name",label:"First Name",val:firstName,set:setFirstName},{id:"last_name",label:"Last Name",val:lastName,set:setLastName}].map(f=>(
                  <div key={f.id}>
                    <label htmlFor={f.id} className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>{f.label}</label>
                    <input id={f.id} type="text" required value={f.val} onChange={e=>f.set(e.target.value)}
                      className="block w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}} />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>
                Email Address
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none transition-all"
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}} />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>
                Password
              </label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none transition-all"
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}} />
            </div>

            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="dob" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>Date of Birth</label>
                    <input id="dob" type="date" required value={dob} onChange={(e) => setDob(e.target.value)}
                      className="block w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}} />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>Gender</label>
                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}
                      className="block w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="height" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>Height (cm)</label>
                    <input id="height" type="text" placeholder="e.g. 175" value={height} onChange={(e) => setHeight(e.target.value)}
                      className="block w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}} />
                  </div>
                  <div>
                    <label htmlFor="blood_group" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:"rgba(167,139,250,0.7)"}}>Blood Group</label>
                    <select id="blood_group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                      className="block w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
                      {["unknown","A+","A-","B+","B-","AB+","AB-","O+","O-"].map(v=><option key={v} value={v}>{v=="unknown"?"Unknown":v}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50 cursor-pointer mt-2"
              style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isSignUp ? "Create Account ✨" : "Sign In →"}
            </button>
          </form>

          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              {isSignUp ? "← Sign in to existing account" : "Create new account →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
