import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface Biomarker {
  id: string;
  report_id: string;
  user_id: string;
  name: string;
  value: number;
  unit: string;
  reference_range: string | null;
  status: "normal" | "low" | "high";
  recorded_at: string;
}

export const useBiomarkers = () => {
  const queryClient = useQueryClient();

  // Fetch historical measurements of a specific biomarker (for charting)
  const useGetBiomarkerHistory = (name?: string) => {
    const url = name ? `/biomarkers?name=${encodeURIComponent(name)}` : "/biomarkers";
    return useQuery<Biomarker[]>({
      queryKey: ["biomarkers", name],
      queryFn: () => api.get<Biomarker[]>(url),
      enabled: name === undefined || !!name,
    });
  };

  // Fetch summary listing of latest recorded values
  const useGetBiomarkerSummary = () => {
    return useQuery<Biomarker[]>({
      queryKey: ["biomarkers", "summary"],
      queryFn: () => api.get<Biomarker[]>("/biomarkers/summary"),
    });
  };

  // Update a specific biomarker's record values
  const useUpdateBiomarker = () => {
    return useMutation({
      mutationFn: ({ id, value, unit, reference_range, recorded_at }: { id: string; value: number; unit: string; reference_range: string | null; recorded_at: string }) =>
        api.put<Biomarker>(`/biomarkers/${id}`, { value, unit, reference_range, recorded_at }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["biomarkers"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      },
    });
  };

  // Delete a specific biomarker record from database memory
  const useDeleteBiomarker = () => {
    return useMutation({
      mutationFn: (id: string) => api.delete<{ status: string; message: string }>(`/biomarkers/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["biomarkers"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      },
    });
  };

  // Manually create a new biomarker record
  const useCreateBiomarker = () => {
    return useMutation({
      mutationFn: (data: { name: string; value: number; unit: string; reference_range: string | null; recorded_at: string }) =>
        api.post<Biomarker>("/biomarkers", data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["biomarkers"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      },
    });
  };

  return {
    useGetBiomarkerHistory,
    useGetBiomarkerSummary,
    useUpdateBiomarker,
    useDeleteBiomarker,
    useCreateBiomarker,
  };
};
