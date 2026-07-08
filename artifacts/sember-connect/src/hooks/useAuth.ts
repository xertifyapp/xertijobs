import { useGetCurrentUser, getGetCurrentUserQueryKey, type AuthUser } from "@workspace/api-client-react";

export function useAuth() {
  const { data, isLoading } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  const user: AuthUser | null = data ?? null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
