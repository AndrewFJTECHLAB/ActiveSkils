import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "../integrations/supabase/client";

type Profile = {
  first_name: string;
  last_name: string;
  resultat_prompt1: string;
  extracted_individual_data: string;
  extracted_formations_data: string;
  extracted_parcours_data: string;
  extracted_autres_experiences_data: string;
  extracted_realisations_data: string;
} | null;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile;
  isLoading: boolean;
  refreshProfile: () => void;
};

const InitialProfileState: Profile = {
  first_name: "",
  last_name: "",
  extracted_autres_experiences_data: "",
  extracted_formations_data: "",
  extracted_individual_data: "",
  extracted_parcours_data: "",
  extracted_realisations_data: "",
  resultat_prompt1: "",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(InitialProfileState);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (session: Session) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, resultat_prompt1, extracted_individual_data, extracted_formations_data, extracted_parcours_data, extracted_autres_experiences_data, extracted_realisations_data"
        )
        .eq("user_id", session.user.id)
        .maybeSingle();

      setProfile(data ?? InitialProfileState);
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
      setProfile(InitialProfileState);
    }
  };

  const loadUser = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session) {
      fetchProfile(session);
    }
    setIsLoading(false); // Always mark loading complete immediately
  };

  const refreshProfile = async () => await fetchProfile(session);

  useEffect(() => {
    if (window.location.pathname === "/auth") {
      setIsLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => loadUser(session));

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadUser(session));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD) {
      const hostname = window.location.hostname;
      const path = window.location.pathname;

      if (!hostname.startsWith("app.") && path !== "/") {
        window.location.href = import.meta.env.VITE_HOME_URL;
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isLoading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if(!context){
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}