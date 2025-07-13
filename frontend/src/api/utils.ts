import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME } from "@/api/config";
import Cookies from "js-cookie";
import type { QueryClient } from "@tanstack/react-query";

type FetchOptions = {
  data?: Record<string, any>;
  formData?: FormData;
  method: string;
};

export const performRequest = async (
  url: string,
  { data, method }: FetchOptions,
): Promise<any> => {
  const request = {
    method: method.toUpperCase(),
    headers: {
      [CSRF_TOKEN_HEADER_NAME]: Cookies.get(CSRF_TOKEN_COOKIE_NAME),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    redirect: "follow",
    body: (data && JSON.stringify(data)) || undefined,
  };

  // @ts-ignore
  const response = await fetch(url, request);
  const isJson =
    response.headers.get("content-type") === "application/json" &&
    response.body !== null;

  // Exit if OK
  if (response?.ok) {
    return isJson ? response.json() : Promise.resolve({});
  }

  // Handle errors
  const errorResponse = isJson ? await response.json() : {};
  const errorPayload = {
    status: response.status,
    text: response.statusText,
    errors: errorResponse,
  };
  return Promise.reject(errorPayload);
};

/**
 * Очищает cookies авторизации и состояние кэша
 */
export const clearAuthState = (queryClient: QueryClient): void => {
  // Очищаем cookies сессии
  Cookies.remove("django_react_starter-sessionid");
  Cookies.remove("django_react_starter-csrftoken");
  
  // Очищаем кэш запросов
  queryClient.removeQueries({ queryKey: ["self"] });
  queryClient.removeQueries({ queryKey: ["auth", "check"] });
};
