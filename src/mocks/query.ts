"use client";

import { useCallback, useState } from "react";

export interface MockQueryResult<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<{ data: T }>;
}

export function useMockQuery<T>(data: T): MockQueryResult<T> {
  const refetch = useCallback(async () => ({ data }), [data]);
  return { data, isLoading: false, isError: false, error: null, refetch };
}

export interface MockMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  error: Error | null;
}

export function useMockMutation<TData, TVariables>(
  handler: (variables: TVariables) => TData | Promise<TData>,
): MockMutationResult<TData, TVariables> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(
    async (variables: TVariables) => {
      setIsPending(true);
      setError(null);
      try {
        return await handler(variables);
      } catch (reason) {
        const nextError = reason instanceof Error ? reason : new Error("Mock mutation failed");
        setError(nextError);
        throw nextError;
      } finally {
        setIsPending(false);
      }
    },
    [handler],
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      void mutateAsync(variables);
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending, error };
}
