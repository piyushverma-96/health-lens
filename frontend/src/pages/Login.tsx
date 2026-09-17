import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { HeartPulse, Loader2 } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTab = searchParams.get("tab");
  const redirectTarget = targetTab ? `/dashboard?tab=${targetTab}` : "/dashboard";
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
          if (signInErr) throw signInErr;
          navigate(redirectTarget);
        } catch {
          setLoading(false);
        }
      };
      autoLog();
    }
  }, [searchParams]);

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
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail === "demo@healthlens.ai" || normalizedEmail.startsWith("demo")) {
          mockLogin("demo@healthlens.ai", {
            first_name: "Piyush",
            last_name: "Verma",
            date_of_birth: "1995-04-12",
            gender: "male",
            height: "175",
            blood_group: "B+",
            intake_responses: {
              primary_goals: ["Cardiovascular Support", "Metabolic Health", "Energy Optimization"],
              diet: "balanced",
              activity_level: "moderate",
              sleep_hours: "7_8",
              family_history: ["Type 2 Diabetes", "Hypertension"]
            }
          });
          setLoading(false);
          navigate("/");
          return;
        }

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
    <div className="min-h-screen bg-clinical-alabaster flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-2 text-clinical-blue text-4xl font-extrabold tracking-tight font-heading">
          <HeartPulse className="h-10 w-10 text-clinical-blue animate-pulse" />
          <span>HealthLens <span className="text-clinical-slate font-light">AI</span></span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-heading font-semibold text-clinical-slate">
          {isSignUp ? "Create your health profile" : "Access your health timeline"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-serif italic">
          "Educational health intelligence at your fingertips"
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>

          {isMockMode && (
            <div className="p-3 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200">
              <span className="font-semibold block mb-0.5">Mock Mode Active</span>
              No Supabase config found. Sign in or register with any credentials to preview the app shell.
            </div>
          )}


            {error && (
              <div className={`p-3 rounded-lg text-sm ${error.includes("created") ? "bg-clinical-green-light text-clinical-green-dark" : "bg-red-50 text-red-700"}`}>
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm"
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dob" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date of Birth
                    </label>
                    <input
                      id="dob"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Biological Gender
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm bg-white text-gray-700"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="height" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Height (cm)
                    </label>
                    <input
                      id="height"
                      type="text"
                      placeholder="e.g. 175"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="blood_group" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Blood Group
                    </label>
                    <select
                      id="blood_group"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-clinical-blue focus:border-clinical-blue text-sm bg-white text-gray-700"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-clinical-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinical-blue transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                mockLogin("demo@healthlens.ai", {
                  first_name: "Piyush",
                  last_name: "Verma",
                  date_of_birth: "1995-04-12",
                  gender: "male",
                  height: "175",
                  blood_group: "B+",
                  intake_responses: {
                    primary_goals: ["Cardiovascular Support", "Metabolic Health", "Energy Optimization"],
                    diet: "balanced",
                    activity_level: "moderate",
                    sleep_hours: "7_8",
                    family_history: ["Type 2 Diabetes", "Hypertension"]
                  }
                });
                navigate("/");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-clinical-blue bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all active:scale-[0.98]"
            >
              <HeartPulse className="h-4 w-4 text-clinical-blue" />
              1-Click Demo Patient Access (Instant Dashboard & AI)
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to HealthLens?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-clinical-slate bg-clinical-alabaster hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinical-blue"
              >
                {isSignUp ? "Sign in to existing account" : "Start Your Health Timeline"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
