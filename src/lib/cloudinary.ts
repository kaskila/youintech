import { v2 as cloudinary } from "cloudinary";

// Server-only. Never import this from a Client Component — CLOUDINARY_API_SECRET
// is read here and must never reach the browser (see CLAUDE.md §3). The only
// thing the client ever receives is a short-lived signature minted by
// src/app/api/cloudinary/sign/route.ts, which imports this module.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
