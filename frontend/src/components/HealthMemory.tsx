import React, { useState } from "react";
import { useBiomarkers } from "../hooks/useBiomarkers";
import type { Biomarker } from "../hooks/useBiomarkers";
import { 
  Database, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2, 
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export const HealthMemory: React.FC = () => {
  const { useGetBiomarkerHistory, useUpdateBiomarker, useDeleteBiomarker, useCreateBiomarker } = useBiomarkers();
  const { data: biomarkers, isLoading, error } = useGetBiomarkerHistory();
  
  const updateMutation = useUpdateBiomarker();
  const deleteMutation = useDeleteBiomarker();
  const createMutation = useCreateBiomarker();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<{ [name: string]: boolean }>({});
  
  // New Manual Log Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState<string>("");
  const [newUnit, setNewUnit] = useState("");
  const [newRefRange, setNewRefRange] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [addError, setAddError] = useState<string | null>(null);

  const commonBiomarkers = [
    "LDL", "HDL", "Triglycerides", "Total Cholesterol", "Vitamin D", "Hemoglobin", "TSH", "Creatinine", "HbA1c", "RBC", "WBC", "Platelets"
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim()) {
      setAddError("Biomarker name is required.");
      return;
    }
    const val = parseFloat(newValue);
    if (isNaN(val)) {
      setAddError("Please enter a valid numeric value.");
      return;
    }
    if (!newUnit.trim()) {
      setAddError("Unit (e.g. mg/dL, ng/mL) is required.");
      return;
    }
    if (!newDate) {
      setAddError("Recorded date is required.");
      return;
    }

    const confirmMessage = (
      `Are you sure you want to manually add this biomarker record to your health memory?\n\n` +
      `Biomarker: ${newName.trim()}\n` +
      `Value: ${val} ${newUnit.trim()}\n` +
      `Date: ${newDate}\n\n` +
      `This manual entry will update your trends and chat assistant memory.`
    );

    if (window.confirm(confirmMessage)) {
      try {
        await createMutation.mutateAsync({
          name: newName.trim(),
          value: val,
          unit: newUnit.trim(),
          reference_range: newRefRange.trim() || null,
          recorded_at: newDate
        });
        
        // Reset form
        setNewName("");
        setNewValue("");
        setNewUnit("");
        setNewRefRange("");
        setNewDate(new Date().toISOString().substring(0, 10));
        setIsAdding(false);
      } catch (err: any) {
        console.error("Failed to add custom biomarker:", err);
        setAddError(err.message || "Failed to save record.");
      }
    }
  };
  
  // Edit Form Fields
  const [editValue, setEditValue] = useState<number>(0);
  const [editUnit, setEditUnit] = useState("");
  const [editRefRange, setEditRefRange] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleStartEdit = (b: Biomarker) => {
    setEditingId(b.id);
    setEditValue(b.value);
    setEditUnit(b.unit);
    setEditRefRange(b.reference_range || "");
    setEditDate(b.recorded_at.substring(0, 10)); // Ensure YYYY-MM-DD
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (b: Biomarker) => {
    const confirmMessage = (
      `Are you sure you want to update the value of ${b.name} to ${editValue} ${editUnit}?\n\n` +
      `Although values primarily populate from your uploaded reports, you are manually changing this database record. ` +
      `This will affect trend charts and chatbot advice.`
    );

    if (window.confirm(confirmMessage)) {
      try {
        await updateMutation.mutateAsync({
          id: b.id,
          value: editValue,
          unit: editUnit,
          reference_range: editRefRange || null,
          recorded_at: editDate
        });
        setEditingId(null);
      } catch (err) {
        console.error("Failed to update biomarker memory:", err);
        alert("Failed to save changes.");
      }
    }
  };

  const handleDelete = async (b: Biomarker) => {
    const confirmMessage = (
      `WARNING: Are you sure you want to delete this ${b.name} measurement of ${b.value} ${b.unit} (recorded on ${b.recorded_at})?\n\n` +
      `This action directly modifies your database memory, affecting all trend charts and chat coach recommendations.`
    );

    if (window.confirm(confirmMessage)) {
      try {
        await deleteMutation.mutateAsync(b.id);
      } catch (err) {
        console.error("Failed to delete biomarker memory:", err);
        alert("Failed to delete record.");
      }
    }
  };

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Filter biomarkers by search term
  const filteredBiomarkers = biomarkers
    ? biomarkers.filter((b) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Group biomarkers by name
  const groupedBiomarkers: { [name: string]: Biomarker[] } = {};
  filteredBiomarkers.forEach((b) => {
    if (!groupedBiomarkers[b.name]) {
      groupedBiomarkers[b.name] = [];
    }
    groupedBiomarkers[b.name].push(b);
  });

  // Sort groups alphabetically by name
  const sortedGroupNames = Object.keys(groupedBiomarkers).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-emerald-50 text-emerald-700 border border-emerald-150";
      case "high":
        return "bg-red-50 text-red-700 border border-red-150";
      case "low":
        return "bg-blue-50 text-blue-700 border border-blue-150";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-150";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24">
        <Loader2 className="h-10 w-10 text-gold-leaf animate-spin mb-4" />
        <p className="text-sm text-clinical-slate font-semibold uppercase tracking-widest font-heading">Retrieving health memory database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-heading font-bold text-red-800">Connection Failed</h3>
        <p className="text-xs text-red-600 mt-1">{(error as any).message || "Could not retrieve database records."}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gold-border shadow-md p-6 lg:p-8 space-y-6 fade-in">
      <div className="border-b border-gray-150 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-clinical-slate flex items-center gap-2">
            <Database className="h-5.5 w-5.5 text-gold-leaf" />
            <span>Health Memory Control Panel</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review, correct, or remove individual biomarker records. Adjusting values dynamically updates charts and chat context.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search biomarkers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-clinical-slate bg-white font-medium"
          />
        </div>
      </div>

      {/* Database Warning Banner */}
      <div className="border-l-2 border-amber-500/80 pl-4 flex items-start gap-3 my-4">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-gray-500 leading-relaxed">
          <span className="font-bold text-clinical-slate mr-1.5">Database Memory Warning:</span>
          The records below represent your isolated clinical history. Updates will affect trend analyses and the chatbot coach. Only change records if they were extracted incorrectly from the scans.
        </div>
      </div>

      {/* Add Custom Record Panel Toggle */}
      <div className="flex justify-between items-center py-2.5 border-b border-gold-border/60">
        <span className="text-[11px] text-gray-500 font-medium">
          Need to log a metric manually? Add a new record here.
        </span>
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-leaf hover:bg-gold-muted text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            + Add Custom Record
          </button>
        ) : (
          <button
            onClick={() => {
              setIsAdding(false);
              setAddError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-clinical-slate text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-300 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            Cancel Add
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-[#FAF9F6]/50 border border-gold-border p-5 rounded-2xl space-y-4 fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-slate border-b border-gold-border/60 pb-2">
            Record New Health Reading
          </h3>
          
          {addError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-[10px] font-medium border border-red-150">
              {addError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Biomarker Name with suggestions */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Biomarker Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vitamin D"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-clinical-slate bg-white font-medium"
                list="biomarker-suggestions"
              />
              <datalist id="biomarker-suggestions">
                {commonBiomarkers.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Value */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Numeric Value
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 32"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-clinical-slate bg-white font-medium font-mono"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Unit
              </label>
              <input
                type="text"
                placeholder="e.g. ng/mL, mg/dL"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-clinical-slate bg-white font-medium"
              />
            </div>

            {/* Reference Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Reference Range (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 30-100, <130"
                value={newRefRange}
                onChange={(e) => setNewRefRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-clinical-slate bg-white font-medium font-mono"
              />
            </div>

            {/* Date Recorded */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Date Recorded
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-leaf focus:border-gold-leaf text-clinical-slate bg-white font-medium font-mono"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-2 bg-gold-leaf hover:bg-gold-muted text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 h-8.5"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Manual Entry</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {sortedGroupNames.length > 0 ? (
        <div className="space-y-1">
          {sortedGroupNames.map((name) => {
            const groupRecords = groupedBiomarkers[name].sort(
              (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
            );
            const latestRecord = groupRecords[0];
            const isExpanded = !!expandedGroups[name];

            return (
              <div key={name} className="border-b border-gold-border/60 last:border-b-0 py-2">
                {/* Group Summary Header */}
                <div
                  onClick={() => toggleGroup(name)}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 hover:bg-gold-light/20 rounded-xl px-2 transition-colors cursor-pointer gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gold-leaf/10 text-gold-leaf rounded-xl border border-gold-leaf/25">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                        {name}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono bg-gray-100 text-gray-500 border border-gray-150">
                          {groupRecords.length} {groupRecords.length === 1 ? "record" : "records"}
                        </span>
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Latest recorded date: {latestRecord.recorded_at.substring(0, 10)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4.5 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Latest Value</span>
                      <span className="text-xs font-mono font-bold text-gray-900">
                        {latestRecord.value} <span className="text-[9px] font-sans text-gray-400 font-normal">{latestRecord.unit}</span>
                      </span>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${getStatusColor(latestRecord.status)}`}>
                      {latestRecord.status}
                    </span>

                    <button className="p-1.5 text-gray-400 hover:text-gold-leaf cursor-pointer">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Group Historical Records Table */}
                {isExpanded && (
                  <div className="mt-2 ml-10 border border-gold-border/60 rounded-xl overflow-hidden shadow-xs bg-[#FAF9F6]/10">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gold-border text-left text-xs">
                        <thead className="bg-[#FAF9F6]/50 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-2.5">Value</th>
                            <th className="px-6 py-2.5">Unit</th>
                            <th className="px-6 py-2.5">Reference Range</th>
                            <th className="px-6 py-2.5">Date Recorded</th>
                            <th className="px-6 py-2.5">Status</th>
                            <th className="px-6 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-border/85">
                          {groupRecords.map((b) => {
                            const isEditing = editingId === b.id;

                            return (
                              <tr key={b.id} className="hover:bg-gold-light/20 transition-colors">
                                {/* Value */}
                                <td className="px-6 py-3 font-mono font-bold text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={editValue}
                                      onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                                    />
                                  ) : (
                                    b.value
                                  )}
                                </td>

                                {/* Unit */}
                                <td className="px-6 py-3 text-clinical-slate font-medium">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editUnit}
                                      onChange={(e) => setEditUnit(e.target.value)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white"
                                    />
                                  ) : (
                                    b.unit
                                  )}
                                </td>

                                {/* Reference Range */}
                                <td className="px-6 py-3 font-mono text-gray-500">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editRefRange}
                                      onChange={(e) => setEditRefRange(e.target.value)}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                                      placeholder="e.g. 30-100"
                                    />
                                  ) : (
                                    b.reference_range || "N/A"
                                  )}
                                </td>

                                {/* Date */}
                                <td className="px-6 py-3 font-mono text-gray-500">
                                  {isEditing ? (
                                    <input
                                      type="date"
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                                    />
                                  ) : (
                                    b.recorded_at.substring(0, 10)
                                  )}
                                </td>

                                {/* Status */}
                                <td className="px-6 py-3">
                                  {isEditing ? (
                                    <span className="text-[10px] text-gray-400 font-mono italic">Recalculating...</span>
                                  ) : (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getStatusColor(b.status)}`}>
                                      {b.status}
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2.5">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() => handleSaveEdit(b)}
                                          className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 transition-all cursor-pointer"
                                          title="Save Changes"
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="p-1 rounded bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-all cursor-pointer"
                                          title="Cancel Edit"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(b);
                                          }}
                                          className="p-1 rounded bg-white text-gray-400 border border-gray-200 hover:border-gold-leaf hover:text-gold-leaf transition-all cursor-pointer"
                                          title="Edit Record"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(b);
                                          }}
                                          className="p-1 rounded bg-white text-gray-400 border border-gray-200 hover:border-red-500 hover:text-red-500 transition-all cursor-pointer"
                                          title="Delete Record"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 border border-dashed border-gray-200 rounded-3xl text-center shadow-xs flex flex-col justify-center items-center">
          <Database className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-sm font-heading font-bold text-clinical-slate">No Stored Memory Found</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-normal">
            No biomarkers are currently indexed in your database memory. Upload health reports or approve mismatched reports to seed your timeline.
          </p>
        </div>
      )}
    </div>
  );
};
