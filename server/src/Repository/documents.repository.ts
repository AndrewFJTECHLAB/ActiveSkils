import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import { DOCUMENT_STATUS } from "../types/enum";
import { DocumentRepository } from "../types/type";

export class DocumentsRepository implements DocumentRepository {
  private client: SupabaseClient;
  private table = "documents";

  constructor() {
    const supabaseClient = getSupabaseClient();

    this.client = supabaseClient;
  }

  public updateDocument = async (
    path: string,
    data: Record<string, unknown>
  ) => {
    const { error } = await this.client
      .from(this.table)
      .update(data)
      .eq("file_path", path);

    if (error) {
      throw new Error(error.message);
    }
  };

  public getSignedUrl = async (path: string) => {
    const URL_VALIDITY_TIMEOUT = 600;

    const { data, error } = await this.client.storage
      .from(this.table)
      .createSignedUrl(path, URL_VALIDITY_TIMEOUT);

    if (error) throw new Error(error.message);

    return data.signedUrl;
  };

  public getDocumentData = async (path: string, fields: string) => {
    const { data } = await this.client
      .from(this.table)
      .select(fields)
      .eq("file_path", path)
      .single();

    return data;
  };

  public uploadMarkdown = async (path: string, content: any) => {
    const { error } = await this.client.storage
      .from(this.table)
      .upload(path, content, { contentType: "text/markdown" });

    if (error) {
      throw new Error(error.message);
    }
  };

  public getDocuments = async (documentIds: string[]) => {
    const { data, error } = await this.client
      .from(this.table)
      .select("*")
      .in("id", documentIds)
      .eq("status", DOCUMENT_STATUS.COMPLETED);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  public getDocumentFromStorage = async (path: string) => {
    const { data, error } = await this.client.storage
      .from(this.table)
      .download(path);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };
}
