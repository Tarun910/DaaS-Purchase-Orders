import { DomainError, ErrorCodes } from "../errors.js";

export type Role = "ADMIN" | "WAREHOUSE" | "VIEWER";

export interface AuthUser {
  role: Role;
  token: string;
}

function tokenRoleMap(): Record<string, Role> {
  return {
    [process.env.AUTH_TOKEN_ADMIN ?? "admin-token"]: "ADMIN",
    [process.env.AUTH_TOKEN_WAREHOUSE ?? "warehouse-token"]: "WAREHOUSE",
    [process.env.AUTH_TOKEN_VIEWER ?? "viewer-token"]: "VIEWER",
  };
}

export function resolveUserFromAuthHeader(
  authorizationHeader: string | undefined,
): AuthUser | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  const role = tokenRoleMap()[token];
  if (!role) {
    return null;
  }

  return { role, token };
}

export function requireRole(user: AuthUser | null, allowed: Role[]): AuthUser {
  if (!user) {
    throw new DomainError(
      ErrorCodes.UNAUTHENTICATED,
      "Authentication required. Provide Authorization: Bearer <token>.",
      401,
    );
  }

  if (!allowed.includes(user.role)) {
    throw new DomainError(
      ErrorCodes.FORBIDDEN,
      `Role ${user.role} is not permitted for this operation.`,
      403,
    );
  }

  return user;
}
