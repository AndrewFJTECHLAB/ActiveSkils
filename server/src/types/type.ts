interface DocumentRepository {
    updateDocument: (path: string, data: Record<string, unknown>) => Promise<void>
    getSignedUrl: (path: string) => Promise<string>
    getDocumentData: (path: string, fields: string) => Promise<unknown>
    uploadMarkdown: (path: string, content: any) => Promise<void>
}