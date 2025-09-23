import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import { PromptRepository } from "../types/type";
import { Prompts } from "../types/enum";

export class PromptsRepository implements PromptRepository {
  private client: SupabaseClient;
  private table = "prompts";

  constructor() {
    const supabaseClient = getSupabaseClient();

    this.client = supabaseClient;
  }

  public getPromptByName = async (promptName: Prompts) => {
    const { data, error } = await this.client
      .from(this.table)
      .select("prompt_text, system_message")
      .eq("name", promptName)
      .eq("active", true)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };
}
