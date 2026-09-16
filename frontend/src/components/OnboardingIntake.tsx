import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { 
  Heart, 
  Activity, 
  Moon, 
  Award, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertCircle 
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

  // Form states
  const [primaryGoals, setPrimaryGoals] = useState<string[]>(
    profile?.intake_responses?.primary_goals || []
  );
  const [diet, setDiet] = useState<string>(
    profile?.intake_responses?.diet || ""
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    profile?.intake_responses?.activity_level || ""
  );
  const [sleepHours, setSleepHours] = useState<string>(
    profile?.intake_responses?.sleep_hours || ""
  );
  const [tobaccoAlcohol, setTobaccoAlcohol] = useState<string>(
    profile?.intake_responses?.tobacco_alcohol || ""
  );
  const [familyHistory, setFamilyHistory] = useState<string[]>(
    profile?.intake_responses?.family_history || []
  );

  const goalsOptions = [
    { id: "general_wellness", label: "General Wellness", desc: "Maintain overall metabolic and physiological base wellness." },
    { id: "cardiovascular_support", label: "Cardiovascular Health", desc: "Optimize cholesterol markers, blood pressure, and heart longevity." },
    { id: "metabolic_optimization", label: "Metabolic & Glucose Control", desc: "Monitor insulin sensitivity, HbA1c, and clean metabolic pathways." },
    { id: "energy_improvement", label: "Energy & Fatigue Management", desc: "Improve sleep hygiene, hormone baselines, and constant vitality." },
    { id: "strength_composition", label: "Strength & Body Composition", desc: "Support muscle growth, bone density, and athletic performance." }
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
    if (step === 1 && primaryGoals.length === 0) {
      setError("Please select at least one primary wellness goal to continue.");
      return;
    }
    if (step === 2 && (!diet || !activityLevel || !sleepHours || !tobaccoAlcohol)) {
      setError("Please fill in all lifestyle baseline questions to continue.");
      return;
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
      setError("Please select at least one history parameter or select None.");
      return;
    }
    
    setSaving(true);
    setError(null);

    const intakeResponses = {
      primary_goals: primaryGoals,
      diet,
      activity_level: activityLevel,
      sleep_hours: sleepHours,
      tobacco_alcohol: tobaccoAlcohol,
      family_history: familyHistory
    };

    try {
      await updateProfile({ intake_responses: intakeResponses });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-clinical-slate/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gold-border shadow-2xl max-w-xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gold-leaf bg-gold-leaf/10 px-3 py-1 rounded-full">
            {isRetake ? "Update Patient Intake" : "Clinical Patient Intake"}
          </span>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-clinical-slate">
            Configure Your Health Baseline
          </h2>
          <p className="text-xs text-gray-400 font-serif italic max-w-sm mx-auto">
            "Tailor our intelligence algorithms to your specific physiological profile, habits, and wellness goals."
          </p>
        </div>

        {/* Steps Tracker */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 bg-gold-leaf"
                  : s < step
                  ? "w-3 bg-gold-leaf/40"
                  : "w-3 bg-gray-150"
              }`}
            />
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Step Contents */}
        <div className="py-2">
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-clinical-slate mb-1">
                Step 1: Select Your Health Goals (Multi-select)
              </label>
              <div className="space-y-2.5">
                {goalsOptions.map((option) => {
                  const isSelected = primaryGoals.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleGoalToggle(option.id)}
                      className={`w-full text-left p-3.5 border rounded-2xl transition-all duration-200 flex items-center justify-between cursor-pointer focus:outline-none ${
                        isSelected
                          ? "border-gold-leaf bg-gold-leaf/5 text-gold-leaf shadow-sm"
                          : "border-gray-200 hover:border-gold-leaf/50 hover:bg-gold-leaf/5 text-clinical-slate"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold">{option.label}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{option.desc}</p>
                      </div>
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-gold-leaf border-gold-leaf text-white" : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-clinical-slate">
                Step 2: Lifestyle & Metabolic Baselines
              </label>
              
              {/* Diet Type */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-gold-leaf" /> Diet Type
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {["omnivore", "vegetarian", "vegan", "keto"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiet(d)}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold uppercase tracking-wider text-center cursor-pointer transition-all ${
                        diet === d
                          ? "border-gold-leaf bg-gold-leaf/5 text-gold-leaf"
                          : "border-gray-200 text-clinical-slate hover:border-gold-leaf/50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Activity */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-gold-leaf" /> Exercise & Activity
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "sedentary", label: "Sedentary" },
                    { id: "lightly_active", label: "Lightly Active" },
                    { id: "moderately_active", label: "Moderately Active" },
                    { id: "very_active", label: "Very Active" }
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityLevel(act.id)}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold uppercase tracking-wider text-center cursor-pointer transition-all ${
                        activityLevel === act.id
                          ? "border-gold-leaf bg-gold-leaf/5 text-gold-leaf"
                          : "border-gray-200 text-clinical-slate hover:border-gold-leaf/50"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep Hours */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 text-gold-leaf" /> Average Sleep
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "under_6", label: "< 6 Hours" },
                    { id: "6_to_8", label: "6 - 8 Hours" },
                    { id: "over_8", label: "> 8 Hours" }
                  ].map((slp) => (
                    <button
                      key={slp.id}
                      type="button"
                      onClick={() => setSleepHours(slp.id)}
                      className={`py-2 px-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                        sleepHours === slp.id
                          ? "border-gold-leaf bg-gold-leaf/5 text-gold-leaf"
                          : "border-gray-200 text-clinical-slate hover:border-gold-leaf/50"
                      }`}
                    >
                      {slp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tobacco/Alcohol */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-gold-leaf" /> Tobacco & Alcohol usage
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {["none", "occasional", "frequent"].map((use) => (
                    <button
                      key={use}
                      type="button"
                      onClick={() => setTobaccoAlcohol(use)}
                      className={`py-2 px-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                        tobaccoAlcohol === use
                          ? "border-gold-leaf bg-gold-leaf/5 text-gold-leaf"
                          : "border-gray-200 text-clinical-slate hover:border-gold-leaf/50"
                      }`}
                    >
                      {use}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-clinical-slate mb-1">
                Step 3: Family Clinical History (Select all that apply)
              </label>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-3">
                Sharing hereditary clinical baselines enables our engines to weigh your biomarker anomalies with proper clinical warning filters.
              </p>
              <div className="space-y-2">
                {familyHistoryOptions.map((history) => {
                  const isSelected = familyHistory.includes(history.id);
                  return (
                    <button
                      key={history.id}
                      onClick={() => handleFamilyHistoryToggle(history.id)}
                      className={`w-full text-left p-3 border rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer focus:outline-none ${
                        isSelected
                          ? "border-gold-leaf bg-gold-leaf/5 text-gold-leaf shadow-sm font-semibold"
                          : "border-gray-250 hover:border-gold-leaf/50 hover:bg-gold-leaf/5 text-clinical-slate"
                      }`}
                    >
                      <span className="text-xs">{history.label}</span>
                      <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-gold-leaf border-gold-leaf text-white" : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-150">
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={saving}
              className="px-4 py-2.5 border border-gold-border hover:border-gold-leaf text-gold-leaf hover:bg-gold-leaf/5 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 bg-gold-leaf hover:bg-gold-muted text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Next Step <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 bg-gold-leaf hover:bg-gold-muted text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span>Saving Baseline...</span>
              ) : (
                <>
                  Complete Onboarding <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
