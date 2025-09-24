import axios, { type AxiosRequestConfig } from "axios";

const baseUrl = import.meta.env.VITE_BASE_API_URL ?? "http://localhost:3000";

const apiClient = axios.create({
  baseURL: `${baseUrl}/api`,
  headers: {
    "content-Type": "application/json",
  },
});

export const get = async <T>({
  url,
  config,
}: {
  url: string;
  config?: AxiosRequestConfig;
}): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const post = async <T>({
  url,
  data,
  config,
}: {
  url: string;
  data: unknown;
  config?: AxiosRequestConfig;
}): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};
