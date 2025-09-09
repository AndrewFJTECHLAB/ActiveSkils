import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "../integrations/supabase/client";

type Profile = {
    first_name: string;
    last_name: string;
  } | null;

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile;
    isLoading: boolean;
  };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({ first_name: "", last_name: "" });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (session: Session) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setProfile(data ?? { first_name: "", last_name: "" });
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
      setProfile({ first_name: "", last_name: "" });
    }
  };

  const loadUser = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    if(session) {
      fetchProfile(session)
    }
    setIsLoading(false); // Always mark loading complete immediately
  };

  useEffect(() => {
    if (window.location.pathname === "/auth") {
      setIsLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => loadUser(session));

    supabase.auth.getSession().then(({ data: { session } }) => loadUser(session));

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading }}>
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