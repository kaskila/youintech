import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { INQUIRY_CATEGORY_PARAMS } from "@/lib/validations/inquiry";
import { InquiryCategory } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with YouthInTech — volunteer, partner, support, or just say hello.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const defaultCategory = INQUIRY_CATEGORY_PARAMS[category ?? ""] ?? InquiryCategory.GENERAL;

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Contact</p>
      <h1 className="mt-2 text-display-md">Get in touch</h1>
      <p className="mt-4 text-lead text-ink-600">
        Volunteering, partnering, supporting our work, or just have a question —
        tell us below.
      </p>

      <div className="mt-10">
        <ContactForm defaultCategory={defaultCategory} />
      </div>
    </div>
  );
}
