import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { resolveUserFromAuthHeader } from "./auth/auth.js";
import { toGraphQLError } from "./graphql/errors.js";
import { schema } from "./graphql/schema.js";
import type { GraphQLContext } from "./graphql/context.js";
import { DomainError } from "./errors.js";

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = express();

  const server = new ApolloServer<GraphQLContext>({
    schema,
    formatError: (formattedError, error) => {
      const original = (error as { originalError?: unknown })?.originalError;
      if (original instanceof DomainError) {
        const gqlError = toGraphQLError(original);
        return {
          message: gqlError.message,
          extensions: gqlError.extensions,
          path: formattedError.path,
          locations: formattedError.locations,
        };
      }
      if (formattedError.extensions?.code && formattedError.extensions.code !== "INTERNAL_SERVER_ERROR") {
        return formattedError;
      }
      // Hide unexpected internals from clients
      if (original) {
        const gqlError = toGraphQLError(original);
        return {
          message: gqlError.message,
          extensions: gqlError.extensions,
          path: formattedError.path,
          locations: formattedError.locations,
        };
      }
      return {
        message: formattedError.message,
        extensions: formattedError.extensions,
        path: formattedError.path,
        locations: formattedError.locations,
      };
    },
  });

  await server.start();

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: true,
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const user = resolveUserFromAuthHeader(req.headers.authorization);
        return { user };
      },
    }),
  );

  app.listen(PORT, () => {
    console.info(`DaaS API ready at http://localhost:${PORT}/graphql`);
  });
}

main().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});
