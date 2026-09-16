import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: "user" | "assistant";
  content: string;
  sources: { type: string; snippet?: string; topic?: string; biomarkers?: string[]; content?: string }[];
  created_at: string;
}

export const useChat = () => {
  const queryClient = useQueryClient();

  // List sessions
  const useGetSessions = () => {
    return useQuery<ChatSession[]>({
      queryKey: ["chat-sessions"],
      queryFn: () => api.get<ChatSession[]>("/chat/sessions"),
    });
  };

  // Get messages for a session
  const useGetMessages = (sessionId: string | null) => {
    return useQuery<ChatMessage[]>({
      queryKey: ["chat-messages", sessionId],
      queryFn: () => api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),
      enabled: !!sessionId,
    });
  };

  // Create a new session
  const useCreateSession = () => {
    return useMutation({
      mutationFn: (title?: string) => api.post<ChatSession>("/chat/sessions", { title }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      },
    });
  };

  // Send a message
  const useSendMessage = () => {
    return useMutation({
      mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
        api.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, { content }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.sessionId] });
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      },
    });
  };

  // Delete a session
  const useDeleteSession = () => {
    return useMutation({
      mutationFn: (sessionId: string) => api.delete(`/chat/sessions/${sessionId}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      },
    });
  };

  return {
    useGetSessions,
    useGetMessages,
    useCreateSession,
    useSendMessage,
    useDeleteSession,
  };
};
