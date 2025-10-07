import { post } from "@/lib/axios";

export const extractDocumentData = async (filePath: string) => {
  post({
    url: `/extract/pdf-data`,
    data: { filePath },
  });
};

export const launchExtraction = async (
  userId: string,
  documentIds: string[],
  key: string
) => {
  const response = await post({
    url: `/launch-extraction`,
    data: { documentIds, userId, key },
  });

  return response;
};