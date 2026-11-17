// Shared asset helpers for categories and paginated asset API responses.

export const ASSET_CATEGORIES = [
  "Laptop",
  "Monitor",
  "Printer",
  "Mobile",
  "Other",
];

export const ASSET_CODE_PATTERN = /^AST-\d+$/;

export function normalizeAssetCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function normalizeAssetListResponse(payload) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      page: 1,
      total_pages: 1,
    };
  }

  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    total: Number(payload?.total) || 0,
    page: Number(payload?.page) || 1,
    total_pages: Number(payload?.total_pages) || 1,
  };
}
