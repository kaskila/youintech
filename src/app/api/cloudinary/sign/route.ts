import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/require-staff";
import { cloudinary } from "@/lib/cloudinary";

// One of the few legitimate API routes — see CLAUDE.md §4. Everything else
// is a Server Action; this exists only because the browser needs to reach
// Cloudinary directly (the file must never proxy through our server), and
// that means it needs a signature it can't compute itself.

// Closed on purpose. Any staff member could otherwise sign an upload into an
// arbitrary folder string — this keeps a compromised admin session (or a
// crafted request) from writing outside the paths this endpoint is meant
// for. Extend this list as more models adopt uploads (CLAUDE.md §9).
const ALLOWED_FOLDERS = ["programmes", "opportunities", "events", "stories"] as const;

const signRequestSchema = z.object({
  folder: z.enum(ALLOWED_FOLDERS),
});

// Baked into every signature, not left to the client to request: caps the
// stored master at 1600px wide (never upscaled — "limit", not "fill") and,
// per Cloudinary's documented behavior, running any transformation on
// upload strips embedded IPTC/EXIF/XMP metadata unless fl_keep_iptc is
// passed — we don't pass it, so this same transformation also satisfies
// "strip metadata at upload." See CLAUDE.md §2 (Zambian network
// conditions) — a 12MP phone photo is 4-6MB; this is what keeps the
// uploaded copy small without the maintainer having to resize anything
// by hand first.
const INCOMING_TRANSFORMATION = "c_limit,w_1600";

export async function POST(request: Request) {
  // MUST run before signing anything — an unauthenticated signature
  // endpoint is an open upload bucket on our Cloudinary account and quota.
  const staff = await requireStaff();
  if (!staff.ok) {
    return NextResponse.json({ error: staff.error }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = signRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
  }

  const { folder } = parsed.data;
  const { api_key: apiKey, api_secret: apiSecret, cloud_name: cloudName } = cloudinary.config();
  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 500 });
  }

  // Minted fresh on every call and used immediately by the browser — never
  // cached or reused across requests. Cloudinary independently expires the
  // timestamp on its end after a short window regardless (see the
  // account's upload settings), which is what keeps this "short-lived"
  // rather than something we control end-to-end ourselves.
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder, transformation: INCOMING_TRANSFORMATION };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    transformation: INCOMING_TRANSFORMATION,
    apiKey,
    cloudName,
  });
}
