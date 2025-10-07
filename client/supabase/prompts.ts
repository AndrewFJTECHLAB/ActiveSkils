import { supabase } from '../src/integrations/supabase/client';

export const fetchPrompts = async () => {
    const { data, error } = await supabase
        .from("prompts")
        .select("key:name, button_label")
        .eq("active",true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data
}