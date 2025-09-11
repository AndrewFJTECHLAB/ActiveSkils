import { supabase } from '../src/integrations/supabase/client';
import { DocumentUpload } from '../types/type';

export const saveDocument = async ({
  userId,
  documentTitle,
  documentType,
  filePath,
  fileName,
  fileSize,
}: DocumentUpload) => {
  const {error} = await supabase.from('documents').insert({
    user_id: userId,
    title: documentTitle,
    document_type: documentType,
    file_path: filePath,
    file_name: fileName,
    file_size: fileSize,
    status: 'pending',
  });

  if (error) {
    throw error
  }
};

export const retrieveDocs = async (userId: string) => {
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data
}