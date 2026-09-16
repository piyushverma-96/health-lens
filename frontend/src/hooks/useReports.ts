import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

import type { Biomarker } from "./useBiomarkers";

export interface Report {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  status: string;
  raw_ocr_text: string | null;
  summary: string | null;
  explanation: string | null;
  error_message: string | null;
  patient_name: string | null;
  is_mismatched: boolean;
  approved_for_history: boolean;
  recorded_at: string;
  uploaded_at: string;
  updated_at: string;
  biomarkers?: Biomarker[];
}

export const useReports = () => {
  const queryClient = useQueryClient();

  // Fetch all reports
  const useGetReports = () => {
    return useQuery<Report[]>({
      queryKey: ["reports"],
      queryFn: () => api.get<Report[]>("/reports"),
      refetchInterval: (query) => {
        // Poll reports if any of them are still processing (pending)
        const hasPending = query.state.data?.some(
          (report) => report.status === "pending"
        );
        return hasPending ? 3000 : false; // Poll every 3 seconds
      }
    });
  };

  // Fetch single report details
  const useGetReportDetails = (id: string | null) => {
    return useQuery<Report>({
      queryKey: ["reports", id],
      queryFn: () => api.get<Report>(`/reports/${id}`),
      enabled: !!id,
      refetchInterval: (query) => {
        return query.state.data?.status === "pending" ? 2000 : false; // Poll every 2 seconds if pending
      }
    });
  };

  // Delete report
  const useDeleteReport = () => {
    return useMutation({
      mutationFn: (id: string) => api.delete<{ status: string; message: string }>(`/reports/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        queryClient.invalidateQueries({ queryKey: ["biomarkers"] });
      },
    });
  };

  // Approve mismatched report
  const useApproveReport = () => {
    return useMutation({
      mutationFn: (id: string) => api.post<{ status: string; message: string }>(`/reports/${id}/approve`, {}),
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        queryClient.invalidateQueries({ queryKey: ["reports", id] });
        queryClient.invalidateQueries({ queryKey: ["biomarkers"] });
      },
    });
  };

  // Retry report processing
  const useRetryReport = () => {
    return useMutation({
      mutationFn: (id: string) => api.post<{ status: string; message: string }>(`/reports/${id}/retry`, {}),
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        queryClient.invalidateQueries({ queryKey: ["reports", id] });
      },
    });
  };

  return {
    useGetReports,
    useGetReportDetails,
    useDeleteReport,
    useApproveReport,
    useRetryReport,
  };
};
