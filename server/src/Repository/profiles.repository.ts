import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import { ProfileRepository } from "../types/type";

export class ProfilesRepository implements ProfileRepository {
  private client: SupabaseClient;
  private table = "profiles";

  constructor() {
    const supabaseClient = getSupabaseClient();

    this.client = supabaseClient;
  }

  public updateProfile = async (userId: string, data: any) => {
    const { error } = await this.client
      .from(this.table)
      .update(data)
      .eq("user_id", userId);

    if(error){
      throw error.message
    }
  };
}
