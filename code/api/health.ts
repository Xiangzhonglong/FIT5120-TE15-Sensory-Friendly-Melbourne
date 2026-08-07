import { handleVercelRequest } from "../backend/src/vercel.js";

export default {
  fetch: handleVercelRequest
};
