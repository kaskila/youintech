"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const MAX_BYTES = 5 * 1024 * 1024;

type UploadStatus = "idle" | "uploading" | "error";

interface SignResponse {
  signature: string;
  timestamp: number;
  folder: string;
  transformation: string;
  apiKey: string;
  cloudName: string;
  error?: string;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  error?: { message: string };
}

// Choose file → sign with our own endpoint → upload DIRECT to Cloudinary
// from the browser → store the returned URL on the record. The file never
// proxies through our server (CLAUDINARY_API_SECRET stays server-side —
// see src/lib/cloudinary.ts and src/app/api/cloudinary/sign/route.ts).
//
// Renders two hidden inputs (fieldName/altFieldName) so it drops into an
// existing <form action={serverAction}> unchanged: the surrounding
// Server Action keeps reading formData.get(fieldName) exactly as it did
// when this was a plain text input — see programme-form.tsx.
export function CloudinaryImageUpload({
  folder,
  fieldName,
  altFieldName,
  defaultValue,
  defaultAlt,
  label,
}: {
  folder: string;
  fieldName: string;
  altFieldName: string;
  defaultValue?: string | null;
  defaultAlt?: string | null;
  label: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [altText, setAltText] = useState(defaultAlt ?? "");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function uploadToCloudinary(file: File, sign: SignResponse) {
    return new Promise<string>((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);
      formData.append("transformation", sign.transformation);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        let body: CloudinaryUploadResponse = {};
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // fall through to the generic error below
        }
        if (xhr.status === 200 && body.secure_url) {
          resolve(body.secure_url);
        } else {
          reject(new Error(body.error?.message ?? "Cloudinary rejected the upload."));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."));

      xhr.send(formData);
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    // Reset immediately so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please choose an image file (JPEG, PNG, WebP, etc.).");
      return;
    }

    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setStatus("error");
      setErrorMessage(`This file is ${mb}MB — images must be 5MB or smaller.`);
      return;
    }

    // Alt text is required at upload time, not optional — see
    // CLAUDE.md and the task this widget was built for: nobody is coming
    // back later to add it.
    if (!altText.trim()) {
      setStatus("error");
      setErrorMessage("Add alt text above before choosing an image.");
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setErrorMessage(null);

    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      const sign: SignResponse = await signRes.json();
      if (!signRes.ok) {
        throw new Error(sign.error ?? "Could not start the upload.");
      }

      const url = await uploadToCloudinary(file, sign);
      setImageUrl(url);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed. Try again.");
    }
  }

  function handleRemove() {
    setImageUrl("");
    setAltText("");
    setStatus("idle");
    setErrorMessage(null);
  }

  const inputClass =
    "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={altFieldName} className="text-sm font-medium text-ink-700">
          {label} alt text <span className="font-normal text-ink-500">(required to upload an image)</span>
        </label>
        <input
          id={altFieldName}
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          maxLength={300}
          placeholder="Describe what's actually in the photo"
          className={inputClass}
        />
      </div>

      {imageUrl ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-card border border-border bg-brand-100">
          <Image src={imageUrl} alt={altText} fill sizes="384px" className="object-cover" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "uploading"}
          className="rounded-pill border border-brand-900 px-4 py-2 text-sm font-medium text-brand-900 disabled:opacity-60"
        >
          {status === "uploading" ? "Uploading…" : imageUrl ? "Replace image" : "Choose image"}
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={status === "uploading"}
            className="text-sm font-medium text-danger disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
        <span className="text-xs text-ink-500">Images only, up to 5MB.</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        aria-label={`Choose ${label.toLowerCase()} image file`}
      />

      {status === "uploading" ? (
        <progress value={progress} max={100} className="h-2 w-full max-w-sm" />
      ) : null}

      {status === "error" && errorMessage ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}

      <input type="hidden" name={fieldName} value={imageUrl} />
      <input type="hidden" name={altFieldName} value={altText} />
    </div>
  );
}
