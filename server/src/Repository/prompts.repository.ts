import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import { PromptRepository } from "../types/type";
import { Prompts } from "../types/enum";

export class PromptsRepository implements PromptRepository {
  private client: SupabaseClient;
  private table = "prompts";
  private resultTable = "prompt_result";

  constructor() {
    const supabaseClient = getSupabaseClient();

    this.client = supabaseClient;
  }

  public getPromptByName = async (promptName: Prompts) => {
    const { data, error } = await this.client
      .from(this.table)
      .select("id, prompt_text, system_message")
      .eq("name", promptName)
      .eq("active", true)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  public savePromptResult = async ({
    userId,
    promptId,
    value,
  }: {
    userId: string;
    promptId: string;
    value: string;
  }) => {
    const { error } = await this.client.from(this.resultTable).upsert(
      {
        user_id: userId,
        prompt_id: promptId,
        result: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, prompt_id" }
    );

    if (error) {
      console.log(error.message);
      throw new Error(error.message);
    }
  };

  public getPromptsResult = async (userId: string) => {
    const { data, error } = await this.client
      .from(this.resultTable)
      .select("result, prompts:prompt_id (id, title, sub_title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };
}
