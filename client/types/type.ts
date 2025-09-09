export interface Document {
    id: string;
    title: string;
    document_type: string;
    file_path: string;
    file_name: string;
    file_size: number;
    status: string;
    markdown_content: string | null;
    extraction_error: string | null;
    created_at: string;
    updated_at: string;
  }

export interface DocumentUpload {
  userId: string,
  documentTitle: string,
  documentType: string,
  filePath: string,
  fileName: string,
  fileSize: number,
}