import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { getAuthToken, getStoredRole } from "./auth";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export interface GraphQLRequest {
  document: string;
  variables?: Record<string, unknown>;
}

export interface GraphQLErrorShape {
  message: string;
  extensions?: {
    code?: string;
  };
}

type GraphQLBaseQueryError = {
  status: number;
  data: {
    message: string;
    code?: string;
  };
};

export const graphqlBaseQuery =
  (): BaseQueryFn<GraphQLRequest, unknown, GraphQLBaseQueryError> =>
  async ({ document, variables }) => {
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken(getStoredRole())}`,
        },
        body: JSON.stringify({
          query: document,
          variables,
        }),
      });

      const json = (await response.json()) as {
        data?: unknown;
        errors?: GraphQLErrorShape[];
      };

      if (json.errors?.length) {
        const first = json.errors[0];
        return {
          error: {
            status: response.status,
            data: {
              message: first.message,
              code: first.extensions?.code,
            },
          },
        };
      }

      return { data: json.data };
    } catch {
      return {
        error: {
          status: 500,
          data: {
            message: "Unable to reach the GraphQL API.",
            code: "NETWORK_ERROR",
          },
        },
      };
    }
  };
