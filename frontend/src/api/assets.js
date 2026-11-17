import api from "./axios";
import { normalizeAssetCode } from "../utils/assets";

export function lookupAssetByCode(code) {
  const normalizedCode = normalizeAssetCode(code);
  if (import.meta.env.DEV) {
    console.log("ASSET LOOKUP REQUEST", "GET /assets/lookup", { code: normalizedCode });
  }

  return api
    .get("/assets/lookup", { params: { code: normalizedCode } })
    .then((response) => {
      if (import.meta.env.DEV) {
        console.log("ASSET LOOKUP RESPONSE", response.status, response.data);
      }
      return response.data;
    })
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.log(
          "ASSET LOOKUP ERROR",
          error.response?.status || "network",
          error.response?.data || error.message
        );
      }
      throw error;
    });
}
