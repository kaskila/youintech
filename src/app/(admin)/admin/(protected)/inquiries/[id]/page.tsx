import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format-date";
import { INQUIRY_CATEGORY_LABELS } from "@/lib/validations/inquiry";
import { Role } from "@/generated/prisma/enums";
import { InquiryStatusForm } from "./inquiry-status-form";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  if (user?.role !== Role.ADMIN) {
    redirect("/admin");
  }

  const inquiry = await db.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/inquiries" className="text-sm">
        ← Back to inquiries
      </Link>

      <h1 className="text-display-sm mb-6 mt-2">{inquiry.name}</h1>

      <dl className="mb-6 flex flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-(--shadow-card)">
        <div>
          <dt className="text-eyebrow uppercase text-ink-500">Category</dt>
          <dd className="text-ink-800">{INQUIRY_CATEGORY_LABELS[inquiry.category]}</dd>
        </div>
        <div>
          <dt className="text-eyebrow uppercase text-ink-500">Email</dt>
          <dd>
            <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
          </dd>
        </div>
        {inquiry.phone ? (
          <div>
            <dt className="text-eyebrow uppercase text-ink-500">Phone</dt>
            <dd>
              <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
            </dd>
          </div>
        ) : null}
        {inquiry.organisation ? (
          <div>
            <dt className="text-eyebrow uppercase text-ink-500">Organisation</dt>
            <dd className="text-ink-800">{inquiry.organisation}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-eyebrow uppercase text-ink-500">Message</dt>
          <dd className="whitespace-pre-line text-ink-800">{inquiry.message}</dd>
        </div>
        {inquiry.ageBracket ? (
          <div>
            <dt className="text-eyebrow uppercase text-ink-500">Age range</dt>
            <dd className="text-ink-800">{inquiry.ageBracket}</dd>
          </div>
        ) : null}
        {inquiry.guardianConsent ? (
          <div>
            <dt className="text-eyebrow uppercase text-ink-500">Guardian consent</dt>
            <dd className="text-sm text-ink-600">
              {inquiry.guardianName} ·{" "}
              <a href={`mailto:${inquiry.guardianEmail}`}>{inquiry.guardianEmail}</a>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-eyebrow uppercase text-ink-500">Submitted</dt>
          <dd className="text-ink-800">{formatDateTime(inquiry.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-eyebrow uppercase text-ink-500">Consent</dt>
          <dd className="text-sm text-ink-600">
            Given {formatDateTime(inquiry.consentedAt)} · policy version{" "}
            {inquiry.privacyPolicyVersion}
          </dd>
        </div>
        {inquiry.retentionUntil ? (
          <div>
            <dt className="text-eyebrow uppercase text-ink-500">Retained until</dt>
            <dd className="text-sm text-ink-600">{formatDateTime(inquiry.retentionUntil)}</dd>
          </div>
        ) : null}
      </dl>

      <InquiryStatusForm id={inquiry.id} status={inquiry.status} />
    </div>
  );
}
