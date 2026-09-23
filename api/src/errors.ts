export const ErrorCodes = {
  PO_NOT_FOUND: "PO_NOT_FOUND",
  VENDOR_NOT_FOUND: "VENDOR_NOT_FOUND",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  LOCATION_NOT_FOUND: "LOCATION_NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  QUANTITY_EXCEEDS_REMAINING: "QUANTITY_EXCEEDS_REMAINING",
  DUPLICATE_PO_NUMBER: "DUPLICATE_PO_NUMBER",
  INVALID_PO_ITEM: "INVALID_PO_ITEM",
  DUPLICATE_PRODUCT_LINE: "DUPLICATE_PRODUCT_LINE",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
