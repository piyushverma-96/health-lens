import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  height: string | null;
  blood_group: string | null;
  intake_responses?: any;
}

interface AuthContextType {
  user: any | null; // Use any to allow mock user objects
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  isMockMode: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  mockLogin: (email: string, profileData?: Partial<Profile>) => void;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Detect if we are using placeholder credentials
  const isMockMode = import.meta.env.VITE_SUPABASE_URL === "https://placeholder-project.supabase.co" || 
                     !import.meta.env.VITE_SUPABASE_URL;

  const fetchProfile = async (userId: string) => {
    if (isMockMode) {
      const stored = localStorage.getItem("healthlens_mock_profile");
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        setProfile({
          id: userId,
          first_name: "Demo",
          last_name: "Patient",
          date_of_birth: "1990-01-01",
          gender: "male",
          height: null,
          blood_group: null,
          intake_responses: null
        });
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, date_of_birth, gender, height, blood_group, intake_responses")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!user) return;
    
    if (isMockMode) {
      const current = profile || {
        id: user.id,
        first_name: "Demo",
        last_name: "Patient",
        date_of_birth: "1990-01-01",
        gender: "male",
        height: null,
        blood_group: null,
        intake_responses: null
      };
      const newProfile = { ...current, ...updatedData };
      localStorage.setItem("healthlens_mock_profile", JSON.stringify(newProfile));
      setProfile(newProfile);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", user.id);
      
      if (error) throw error;
      setProfile((prev) => prev ? { ...prev, ...updatedData } : null);
    } catch (err) {
      console.error("Error updating user profile:", err);
      throw err;
    }
  };

  const mockLogin = (email: string, profileData?: Partial<Profile>) => {
    const mockUser = {
      id: "c5a1d5eb-7b58-407c-a779-9991525c1852",
      email: email,
      user_metadata: profileData || {}
    };
    const mockSession = {
      access_token: "mock-jwt-token",
      user: mockUser
    };
    const mockProfile: Profile = {
      id: mockUser.id,
      first_name: profileData?.first_name || "Demo",
      last_name: profileData?.last_name || "Patient",
      date_of_birth: profileData?.date_of_birth || "1990-01-01",
      gender: profileData?.gender || "male",
      height: profileData?.height || null,
      blood_group: profileData?.blood_group || null,
      intake_responses: profileData?.intake_responses || null
    };

    localStorage.setItem("healthlens_mock_user", JSON.stringify(mockUser));
    localStorage.setItem("healthlens_mock_profile", JSON.stringify(mockProfile));
    
    setUser(mockUser);
    setSession(mockSession);
    setProfile(mockProfile);
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never allow loading state to persist longer than 1.8 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1800);

    const initializeAuth = async () => {
      try {
        // 1. Check local mock/demo session first for instant startup
        const storedUser = localStorage.getItem("healthlens_mock_user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (isMounted) {
              setUser(parsedUser);
              setSession({ access_token: "mock-jwt-token", user: parsedUser });
            }
            const storedProfile = localStorage.getItem("healthlens_mock_profile");
            if (storedProfile && isMounted) {
              setProfile(JSON.parse(storedProfile));
            } else {
              await fetchProfile(parsedUser.id);
            }
            if (isMounted) setLoading(false);
            return;
          } catch (storageErr) {
            console.warn("Could not parse stored demo user:", storageErr);
          }
        }

        if (isMockMode) {
          if (isMounted) setLoading(false);
          return;
        }

        // 2. Query Supabase with a 1.5s timeout promise race
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 1500)
        );

        const { data: { session: initialSession } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }

        if (initialSession?.user && isMounted) {
          await Promise.race([
            fetchProfile(initialSession.user.id),
            new Promise((res) => setTimeout(res, 1200))
          ]);
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    if (isMockMode) {
      return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
      };
    }

    // Listen for auth state changes (Only in real Supabase mode)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await Promise.race([
          fetchProfile(newSession.user.id),
          new Promise((res) => setTimeout(res, 1200))
        ]);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [isMockMode]);

  const signOut = async () => {
    setLoading(true);
    localStorage.removeItem("healthlens_mock_user");
    localStorage.removeItem("healthlens_mock_profile");
    try {
      if (!isMockMode) {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((res) => setTimeout(res, 800))
        ]);
      }
    } catch (e) {
      console.warn("SignOut notice:", e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isMockMode, signOut, refreshProfile, mockLogin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
