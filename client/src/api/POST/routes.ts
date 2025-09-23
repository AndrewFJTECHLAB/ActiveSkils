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

export const extractFormations = async (documentIds: string[]) => {
  const response = await post({
    url: `/extract/formations`,
    data: { documentIds },
  });

  return response;
};

export const extractParcoursPro = async (documentIds: string[]) => {
  const response = await post({
    url: "/extract/parcours-pro",
    data: { documentIds },
  });

  return response;
};

export const extractRealisations = async (userId: string) => {
  const response = await post({
    url: "/extract/realisation",
    data: { userId },
  });

  return response;
};

export const extractAutresExperience = async (userId: string) => {
  const response = await post({
    url: "/extract/autres-experience",
    data: { userId },
  });

  return response;
};

export const openAiAssistant = async (
  documentIds: string[],
  userId: string,
  prompt?: string
) => {
  const response = await post({
    url: "/analysis/openAi",
    data: { documentIds, userId, prompt },
  });

  return response;
};
