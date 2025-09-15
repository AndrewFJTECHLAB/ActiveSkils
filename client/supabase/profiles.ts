import { supabase } from "../src/integrations/supabase/client";

export const updateProfile = async (data: any, userId: string) => {
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};
