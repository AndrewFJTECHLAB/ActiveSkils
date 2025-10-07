import { supabase } from "../src/integrations/supabase/client";

export const signInWithPassword = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const signUpWitheEmailAndPassword = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: import.meta.env.VITE_HOME_URL,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};
