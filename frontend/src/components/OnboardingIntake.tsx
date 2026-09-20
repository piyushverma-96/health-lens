import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { 
  HeartPulse, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertCircle,
  User,
  Calendar,
  Sparkles
} from "lucide-react";

interface OnboardingIntakeProps {
  onClose?: () => void;
  isRetake?: boolean;
}

export const OnboardingIntake: React.FC<OnboardingIntakeProps> = ({ onClose, isRetake = false }) => {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Personal Demographic Details (Matching Reference UI top-right)
  const [fullName, setFullName] = useState(
    profile?.first_name 
      ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}` 
      : "Piyush Verma"
  );
  const [dob, setDob] = useState(profile?.date_of_birth || "1995-04-12");
  const [gender, setGender] = useState<string>(profile?.gender || "male");

  // Step 2: Wellness Goals & Lifestyle Baselines
  const [primaryGoals, setPrimaryGoals] = useState<string[]>(
    profile?.intake_responses?.primary_goals || ["cardiovascular_support", "metabolic_optimization"]
  );
  const [diet, setDiet] = useState<string>(
    profile?.intake_responses?.diet || "balanced"
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    profile?.intake_responses?.activity_level || "moderate"
  );
  const [sleepHours, setSleepHours] = useState<string>(
    profile?.intake_responses?.sleep_hours || "7_8"
  );
  const [tobaccoAlcohol, setTobaccoAlcohol] = useState<string>(
    profile?.intake_responses?.tobacco_alcohol || "rarely"
  );

  // Step 3: Family Clinical History
  const [familyHistory, setFamilyHistory] = useState<string[]>(
    profile?.intake_responses?.family_history || ["none"]
  );

  const goalsOptions = [
    { id: "general_wellness", label: "General Wellness", desc: "Maintain overall metabolic and baseline vitality." },
    { id: "cardiovascular_support", label: "Cardiovascular Health", desc: "Optimize cholesterol markers, blood pressure, and heart longevity." },
    { id: "metabolic_optimization", label: "Metabolic & Glucose Control", desc: "Monitor insulin sensitivity, HbA1c, and clean metabolic pathways." },
    { id: "energy_improvement", label: "Energy & Fatigue Management", desc: "Improve sleep hygiene, hormone baselines, and constant vitality." },
    { id: "strength_composition", label: "Strength & Body Composition", desc: "Support muscle maintenance and healthy bone density." }
  ];

  const familyHistoryOptions = [
    { id: "heart_disease", label: "Cardiovascular / Heart Disease" },
    { id: "diabetes", label: "Type 2 Diabetes" },
    { id: "hypertension", label: "Hypertension (High Blood Pressure)" },
    { id: "kidney_disease", label: "Chronic Kidney Disease" },
    { id: "none", label: "No significant family clinical history" }
  ];

  const handleGoalToggle = (goalId: string) => {
    setPrimaryGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId) 
        : [...prev, goalId]
    );
  };

  const handleFamilyHistoryToggle = (historyId: string) => {
    if (historyId === "none") {
      setFamilyHistory(["none"]);
      return;
    }
    setFamilyHistory(prev => {
      const filtered = prev.filter(h => h !== "none");
      return filtered.includes(historyId)
        ? filtered.filter(h => h !== historyId)
        : [...filtered, historyId];
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        setError("Please provide your name to continue.");
        return;
      }
    }
    if (step === 2) {
      if (primaryGoals.length === 0) {
        setError("Please select at least one primary health goal.");
        return;
      }
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (familyHistory.length === 0) {
      setError("Please select at least one history parameter or choose 'No significant history'.");
      return;
    }
    
    setSaving(true);
    setError(null);

    // Split name into first and last
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    const intakeResponses = {
      primary_goals: primaryGoals,
      diet,
      activity_level: activityLevel,
      sleep_hours: sleepHours,
      tobacco_alcohol: tobaccoAlcohol,
      family_history: familyHistory
    };

    try {
      await updateProfile({ 
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob || null,
        gender: gender,
        intake_responses: intakeResponses 
      });
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile intake responses.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      {/* Modal Card with fixed header, scrollable body, and persistent sticky footer */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* ================= FIXED TOP HEADER ================= */}
        <div className="p-6 border-b border-slate-100 bg-[#FDFBF7] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <HeartPulse className="h-4 w-4 animate-pulse" />
              </div>
              <span className="font-heading font-bold text-sm text-slate-900">HealthLens AI</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-700">
                Step {step} of 3
              </span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
              {step === 1 && (isRetake ? "Update Health Profile" : "Tell us about yourself")}
              {step === 2 && "Your Health Goals & Lifestyle"}
              {step === 3 && "Clinical & Family History"}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 1 && "This helps us calibrate reference intervals and personalized medical insights."}
              {step === 2 && "Tailors chatbot recommendations and metabolic warning thresholds."}
              {step === 3 && "Enables our analysis engine to weigh genetic factors when reading lab panels."}
            </p>
          </div>
        </div>

        {/* ================= SCROLLABLE MIDDLE CONTENT ================= */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl text-xs flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Personal Demographic Setup (Matching Reference UI top-right) */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-teal-600" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Piyush Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Gender (Selectable large pill cards matching reference design) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "male", label: "Male" },
                    { id: "female", label: "Female" },
                    { id: "other", label: "Other" }
                  ].map((item) => {
                    const isSelected = gender === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGender(item.id)}
                        className={`py-3 px-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20"
                            : "border-slate-200 bg-white hover:border-teal-600/40 text-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trust Callout */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-teal-600 shrink-0" />
                <p className="text-xs text-teal-900 leading-relaxed">
                  <span className="font-bold">Your health. Your story. Our priority.</span> Reference ranges change based on biological sex and age brackets.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Goals & Lifestyle */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Health Goals (Select all that apply)
                </label>
                <div className="grid grid-cols-1 gap-2.5 mt-2">
                  {goalsOptions.map((g) => {
                    const isSelected = primaryGoals.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleGoalToggle(g.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/50 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900">{g.label}</h4>
                          <p className="text-[11px] text-slate-500 leading-normal">{g.desc}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lifestyle Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Dietary Pattern
                  </label>
                  <select
                    value={diet}
                    onChange={(e) => setDiet(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="balanced">Standard Balanced Diet</option>
                    <option value="plant_based">Plant-Based / Vegetarian</option>
                    <option value="low_carb">Low-Carb / Ketogenic</option>
                    <option value="mediterranean">Mediterranean Diet</option>
                    <option value="other">Other / High-Protein</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Activity Level
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="sedentary">Sedentary (Desk Job, minimal exercise)</option>
                    <option value="moderate">Moderate (1-3 workouts per week)</option>
                    <option value="active">Active (4-6 workouts per week)</option>
                    <option value="athlete">High Intensity / Athlete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nightly Sleep
                  </label>
                  <select
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="under_6">Under 6 hours</option>
                    <option value="6_7">6 to 7 hours</option>
                    <option value="7_8">7 to 8 hours (Optimal)</option>
                    <option value="over_8">8+ hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Alcohol / Smoking
                  </label>
                  <select
                    value={tobaccoAlcohol}
                    onChange={(e) => setTobaccoAlcohol(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="never">Non-smoker / No alcohol</option>
                    <option value="rarely">Rarely / Social only</option>
                    <option value="moderate">Moderate regular use</option>
                    <option value="frequent">Frequent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Clinical & Family History */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Family Clinical History (Select all that apply)
              </label>
              <p className="text-xs text-slate-500">
                Sharing hereditary clinical baselines enables our engines to weigh biomarker anomalies with proper risk context.
              </p>
              
              <div className="space-y-2 mt-2">
                {familyHistoryOptions.map((history) => {
                  const isSelected = familyHistory.includes(history.id);
                  return (
                    <div
                      key={history.id}
                      onClick={() => handleFamilyHistoryToggle(history.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-teal-600 bg-teal-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="text-xs font-semibold text-slate-800">{history.label}</span>
                      <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================= PERSISTENT BOTTOM NAVIGATION FOOTER ================= */}
        {/* Critical Bug Fix: Stays permanently visible on desktop and mobile */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-3 z-20">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span>Saving Setup...</span>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
