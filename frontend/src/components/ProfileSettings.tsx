import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { User, Calendar, Ruler, Droplet, Heart, Check, Loader2 } from "lucide-react";

interface ProfileSettingsProps {
  onRetakeIntake: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onRetakeIntake }) => {
  const { profile, updateProfile } = useAuth();
  
  // Local state for form fields
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [dob, setDob] = useState(profile?.date_of_birth || "");
  const [gender, setGender] = useState(profile?.gender || "unknown");
  const [height, setHeight] = useState(profile?.height || "");
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || "unknown");
  
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
      setMessage({ text: "Profile settings successfully updated!", type: "success" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Failed to update profile settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gold-border shadow-md p-6 lg:p-8 space-y-6 fade-in">
      <div className="border-b border-gray-150 pb-4">
        <h2 className="text-xl font-heading font-bold text-clinical-slate flex items-center gap-2">
          <User className="h-5.5 w-5.5 text-gold-leaf" />
          <span>My Personal Health Profile</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Provide your demographic details to personalize reference ranges, health trend metrics, and chatbot suggestions.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-150" 
            : "bg-red-50 text-red-700 border-red-150"
        }`}>
          {message.type === "success" && <Check className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Name inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              First Name
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-xs font-medium text-clinical-slate bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-xs font-medium text-clinical-slate bg-white"
            />
          </div>
        </div>

        {/* Date of Birth & Biological Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gold-leaf" /> Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-xs font-medium text-clinical-slate bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-gold-leaf" /> Biological Sex
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-xs font-medium text-clinical-slate bg-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Height & Blood Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5 text-gold-leaf" /> Height (cm)
            </label>
            <input
              type="text"
              placeholder="e.g. 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-xs font-medium text-clinical-slate bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Droplet className="h-3.5 w-3.5 text-gold-leaf" /> Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-xs font-medium text-clinical-slate bg-white"
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

        <div className="pt-4 border-t border-gray-150 flex items-center justify-between">
          <button
            type="button"
            onClick={onRetakeIntake}
            className="py-2.5 px-4 border border-gold-border hover:border-gold-leaf text-gold-leaf hover:bg-gold-leaf/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer"
          >
            Retake Lifestyle Intake
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 py-2.5 px-6 bg-gold-leaf hover:bg-gold-muted text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50"
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
