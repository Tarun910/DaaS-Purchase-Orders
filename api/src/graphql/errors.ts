import { GraphQLError } from "graphql";
import { DomainError } from "../errors.js";

export function toGraphQLError(error: unknown): GraphQLError {
  if (error instanceof DomainError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        http: { status: error.statusCode },
      },
    });
  }

  console.error("Unexpected API error:", error);
  return new GraphQLError("An unexpected error occurred.", {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      http: { status: 500 },
    },
  });
}
