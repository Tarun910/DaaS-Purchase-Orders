import type { AuthUser } from "../auth/auth.js";

export interface GraphQLContext {
  user: AuthUser | null;
}
