import { post } from "@/lib/axios"

export const extractDocumentData = async (filePath:string) => {
    const response = await post({
      url: `/extract-pdf-data`,
      data: { filePath },
    });
}