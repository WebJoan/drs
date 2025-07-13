import { API_ROOT_URL } from "@/api/config";
import { performRequest, clearAuthState } from "@/api/utils";
import { routeConfigMap } from "@/router";
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { ApiError } from "../types";

type UseLogout = () => UseMutationResult<void, ApiError, void, unknown>;

export const useLogout: UseLogout = () => {
  const url = `${API_ROOT_URL}/auth/logout/`;
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  return useMutation({
    mutationFn: async (): Promise<void> =>
      await performRequest(url, { method: "POST" }),
    onSuccess: () => {
      clearAuthState(queryClient);
      navigate(routeConfigMap.login.path);
    },
    onError: () => {
      // Даже при ошибке очищаем cookies на всякий случай
      clearAuthState(queryClient);
      navigate(routeConfigMap.login.path);
    },
  });
};
