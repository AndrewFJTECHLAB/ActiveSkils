import { get } from "@/lib/axios";

export const fetchPromptsResult = async (userId: string) => {
  const response = await get({
    url: `/prompt-results/${userId}`,
  });

  return response;
};
