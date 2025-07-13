import { API_ROOT_URL } from "@/api/config";
import { performRequest, clearAuthState } from "@/api/utils";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type { ApiError } from "../types";

type Self = {
  id: number;
  email: string;
  role: string;
};

type ApiSelf = {
  id: number;
  email: string;
  role: string;
};

type UseSelfReturn = {
  isPending: boolean;
  isError: boolean;
  error: ApiError | null;
  data?: Self;
};

const deserializeSelf = (data: ApiSelf): Self => {
  return {
    id: data.id,
    email: data.email,
    role: data.role,
  };
};

export const useSelf = (): UseSelfReturn => {
  const url = `${API_ROOT_URL}/self/account/`;
  const queryClient = useQueryClient();
  
  const { isPending, isError, error, data } = useQuery<ApiSelf, ApiError, Self>(
    {
      queryKey: ["self"],
      queryFn: () => performRequest(url, { method: "GET" }),
      select: deserializeSelf,
      retry: (failureCount, error) => {
        // Не повторяем запрос при ошибке 401 (не авторизован)
        if (error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
  );

  // Если получили ошибку 401, очищаем cookies и кэш
  if (isError && error?.status === 401) {
    clearAuthState(queryClient);
  }

  return useMemo(
    () => ({
      isPending,
      isError,
      error,
      data,
    }),
    [isPending, isError, error, data],
  );
};
