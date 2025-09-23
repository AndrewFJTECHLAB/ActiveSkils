import { OpenAiRole, Prompts } from "./enum";

export interface DocumentRepository {
  updateDocument: (
    path: string,
    data: Record<string, unknown>
  ) => Promise<void>;
  getSignedUrl: (path: string) => Promise<string>;
  getDocumentData: (path: string, fields: string) => Promise<unknown>;
  uploadMarkdown: (path: string, content: any) => Promise<void>;
  getDocuments: (documentsIds: string[]) => Promise<unknown>;
  getDocumentFromStorage: (path: string) => Promise<unknown>;
  getDocumentsByUserId: (userId: string) => Promise<unknown>;
}

export interface ProfileRepository {
  updateProfile: (userId: string, data: any) => Promise<void>;
}

export interface PromptRepository {
  getPromptByName: (promptName: Prompts) => Promise<unknown>;
}

export interface OpenAiMessages {
  role: OpenAiRole;
  content: string;
}
