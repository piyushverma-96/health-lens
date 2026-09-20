import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { 
  User, 
  Calendar, 
  Ruler, 
  Droplet, 
  Heart, 
  Check, 
  Loader2, 
  RefreshCw
} from "lucide-react";

interface ProfileSettingsProps {
  onRetakeIntake: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onRetakeIntake }) => {
  const { profile, updateProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"personal" | "health" | "lifestyle" | "preferences">("personal");

  // Local form states
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [dob, setDob] = useState(profile?.date_of_birth || "");
  const [gender, setGender] = useState(profile?.gender || "male");
  const [height, setHeight] = useState(profile?.height || "");
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || "B+");
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob || null,
        gender: gender,
        height: height || null,
        blood_group: bloodGroup
      });
      setMessage({ text: "Profile calibrated successfully!", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Failed to update profile settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const intake = profile?.intake_responses || {};

  return (
    <div className="max-w-3xl mx-auto panel-card rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            <span>Personal Health Profile & Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Demographic and clinical baseline configurations that calibrate your reference intervals.
          </p>
        </div>

        {/* Section Tabs matching requirement: Personal | Health | Lifestyle | Preferences */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
          {[
            { id: "personal", label: "Personal" },
            { id: "health", label: "Health" },
            { id: "lifestyle", label: "Lifestyle" },
            { id: "preferences", label: "Preferences" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2 transition-all ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.type === "success" && <Check className="h-4 w-4 text-emerald-600" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: PERSONAL */}
        {activeTab === "personal" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-teal-600" />
                  <span>Biological Sex</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: HEALTH */}
        {activeTab === "health" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-teal-600" />
                  <span>Height (cm)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Droplet className="h-3.5 w-3.5 text-teal-600" />
                  <span>Blood Group</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white cursor-pointer"
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

            {/* Health Goals Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Active Goals</span>
              <div className="flex flex-wrap gap-2">
                {(intake.primary_goals || ["Cardiovascular Health", "Metabolic Optimization"]).map((g: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-teal-700">
                    {g.replace(/_/g, " ").toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: LIFESTYLE */}
        {activeTab === "lifestyle" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Diet Pattern</span>
                <p className="text-xs font-bold text-slate-900 capitalize">{intake.diet || "Standard Balanced"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Activity Level</span>
                <p className="text-xs font-bold text-slate-900 capitalize">{intake.activity_level || "Moderate Activity"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Sleep Target</span>
                <p className="text-xs font-bold text-slate-900 capitalize">{intake.sleep_hours || "7 to 8 hours"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Tobacco / Alcohol</span>
                <p className="text-xs font-bold text-slate-900 capitalize">{intake.tobacco_alcohol || "Rarely / Social"}</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onRetakeIntake}
                className="w-full py-3 px-4 rounded-2xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retake Full Lifestyle Questionnaire</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: PREFERENCES */}
        {activeTab === "preferences" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Educational Model Mode</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                HealthLens strictly formats biomarker findings as educational insights. Medical diagnosis must be rendered by a certified doctor.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Unit System</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Standard US / International clinical units (e.g. mg/dL, ng/mL, µIU/mL).
              </p>
            </div>
          </div>
        )}

        {/* Form Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Demographic factors calibrate laboratory references
          </span>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
