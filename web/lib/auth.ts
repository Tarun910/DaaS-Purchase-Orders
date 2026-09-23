export type DemoRole = "ADMIN" | "WAREHOUSE" | "VIEWER";

export const ROLE_TOKENS: Record<DemoRole, string> = {
  ADMIN: "admin-token",
  WAREHOUSE: "warehouse-token",
  VIEWER: "viewer-token",
};

export const ROLE_STORAGE_KEY = "daas-demo-role";

export function getStoredRole(): DemoRole {
  if (typeof window === "undefined") {
    return "ADMIN";
  }
  const value = window.localStorage.getItem(ROLE_STORAGE_KEY);
  if (value === "ADMIN" || value === "WAREHOUSE" || value === "VIEWER") {
    return value;
  }
  return "ADMIN";
}

export function getAuthToken(role: DemoRole = getStoredRole()): string {
  return ROLE_TOKENS[role];
}
