"use client";

import { useActionState } from "react";
import { submitInquiry } from "./actions";
import { inquiryFieldsSchema, INQUIRY_CATEGORY_LABELS } from "@/lib/validations/inquiry";
import type { ActionResult } from "@/lib/action-result";
import { InquiryCategory } from "@/generated/prisma/enums";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

export function ContactForm({ defaultCategory }: { defaultCategory: InquiryCategory }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side pass, sharing the same schema as the server. A
      // courtesy — the Server Action re-validates authoritatively.
      const parsed = inquiryFieldsSchema.safeParse({
        category: formData.get("category"),
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") ?? "",
        organisation: formData.get("organisation") ?? "",
        message: formData.get("message"),
        consent: formData.get("consent") === "on",
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }
      return submitInquiry(formData);
    },
    null
  );

  if (state?.ok) {
    return (
      <div role="status" className="rounded-card border border-border bg-surface-subtle p-6">
        <p className="font-medium text-ink-800">Thanks — we&apos;ve got your message.</p>
        <p className="mt-2 text-sm text-ink-600">
          We&apos;ll get back to you at the email address you gave us.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-ink-700">
          What&apos;s this about?
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultCategory}
          required
          className={inputClass}
        >
          {Object.values(InquiryCategory).map((value) => (
            <option key={value} value={value}>
              {INQUIRY_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink-700">
          Name
        </label>
        <input id="name" name="name" required maxLength={200} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={320}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-ink-700">
          Phone <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <input id="phone" name="phone" maxLength={30} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="organisation" className="text-sm font-medium text-ink-700">
          Organisation <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <input id="organisation" name="organisation" maxLength={200} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-ink-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          className={inputClass}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          I agree that YouthInTech can use this information to respond to my message.
        </span>
      </label>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-pill bg-brand-600 px-5 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
