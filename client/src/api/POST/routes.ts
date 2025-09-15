import { post } from "@/lib/axios";

export const extractDocumentData = async (filePath: string) => {
  post({
    url: `/extract/pdf-data`,
    data: { filePath },
  });
};

export const extractIndividualData = async (documentIds: string[]) => {
  const response = await post({
    url: `/extract/individual-data`,
    data: { documentIds },
  });

  return response;
};
