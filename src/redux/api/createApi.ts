"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type TagDescription =
  | string
  | { type: string; id?: string | number };

export interface RequestSpec {
  url: string;
  method?: HttpMethod;
  params?: Record<string, unknown>;
  data?: unknown;
  responseType?: "json" | "blob";
}

export interface QueryEndpointConfig<TResult, TArg> {
  query: (arg: TArg) => RequestSpec;
  queryKey?: (arg: TArg) => readonly unknown[];
  providesTags?:
    | TagDescription[]
    | ((result: TResult | undefined, arg: TArg) => TagDescription[]);
}

export interface MutationEndpointConfig<TResult, TArg> {
  query: (arg: TArg) => RequestSpec;
  invalidatesTags?:
    | TagDescription[]
    | ((result: TResult | undefined, arg: TArg) => TagDescription[]);
}

type QueryDef<TResult, TArg> = QueryEndpointConfig<TResult, TArg> & {
  kind: "query";
};

type MutationDef<TResult, TArg> = MutationEndpointConfig<TResult, TArg> & {
  kind: "mutation";
};

function normalizeTag(tag: TagDescription): string {
  return typeof tag === "string"
    ? tag
    : tag.id != null
      ? `${tag.type}:${String(tag.id)}`
      : tag.type;
}

async function runRequest<TResult>(spec: RequestSpec): Promise<TResult> {
  const { data } = await apiClient.request<TResult>({
    url: spec.url,
    method: spec.method ?? "GET",
    params: spec.params,
    data: spec.data,
    responseType: spec.responseType,
  });
  return data;
}

function toHookName(endpointName: string, suffix: "Query" | "Mutation") {
  return `use${endpointName.charAt(0).toUpperCase()}${endpointName.slice(1)}${suffix}`;
}

export function createApi(options: { reducerPath: string; tagTypes: string[] }) {
  const { reducerPath } = options;

  const builder = {
    query<TResult, TArg = void>(config: QueryEndpointConfig<TResult, TArg>) {
      return { ...config, kind: "query" as const };
    },
    mutation<TResult, TArg = void>(config: MutationEndpointConfig<TResult, TArg>) {
      return { ...config, kind: "mutation" as const };
    },
  };

  function injectEndpoints<TEndpoints extends Record<string, { kind: "query" | "mutation" }>>(definition: {
    endpoints: (endpointBuilder: typeof builder) => TEndpoints;
    overrideExisting?: boolean;
  }) {
    const defs = definition.endpoints(builder);
    const hooks: Record<string, unknown> = {};

    for (const [name, def] of Object.entries(defs)) {
      if (def.kind === "query") {
        const config = def as QueryDef<unknown, unknown>;
        function useInjectedQuery(
          arg?: unknown,
          queryOptions?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">,
        ) {
          const key = config.queryKey
            ? config.queryKey(arg as never)
            : ([reducerPath, name, arg] as const);
          const tags =
            typeof config.providesTags === "function"
              ? config.providesTags(undefined, arg as never)
              : (config.providesTags ?? []);
          return useQuery({
            queryKey: [...key, { tags: tags.map(normalizeTag) }],
            queryFn: () => runRequest(config.query(arg as never)),
            ...queryOptions,
          });
        }
        hooks[toHookName(name, "Query")] = useInjectedQuery;
      } else {
        const config = def as MutationDef<unknown, unknown>;
        function useInjectedMutation(
          mutationOptions?: UseMutationOptions<unknown, Error, unknown>,
        ) {
          const queryClient = useQueryClient();
          return useMutation({
            mutationFn: (arg: unknown) => runRequest(config.query(arg as never)),
            ...mutationOptions,
            onSuccess: async (data, variables, onMutateResult, context) => {
              const tags =
                typeof config.invalidatesTags === "function"
                  ? config.invalidatesTags(data, variables as never)
                  : (config.invalidatesTags ?? []);
              const normalized = tags.map(normalizeTag);
              await queryClient.invalidateQueries({
                predicate: (query) => {
                  const marker = query.queryKey[query.queryKey.length - 1];
                  if (!marker || typeof marker !== "object" || !("tags" in marker)) {
                    return false;
                  }
                  const provided = (marker as { tags: string[] }).tags ?? [];
                  return normalized.some((tag) => {
                    const [type] = tag.split(":");
                    return provided.some(
                      (providedTag) =>
                        providedTag === tag || providedTag === type || providedTag.startsWith(`${type}:`),
                    );
                  });
                },
              });
              await mutationOptions?.onSuccess?.(data, variables, onMutateResult, context);
            },
          });
        }
        hooks[toHookName(name, "Mutation")] = useInjectedMutation;
      }
    }

    return Object.assign(hooks, { endpoints: defs, reducerPath });
  }

  return { injectEndpoints, reducerPath, tagTypes: options.tagTypes, builder };
}
