import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format-date";
import { INQUIRY_CATEGORY_LABELS } from "@/lib/validations/inquiry";
import { Role, InquiryCategory, InquiryStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

const selectClass =
  "rounded-md border border-border-strong px-3 py-2 text-sm text-ink-800 outline-none focus-visible:border-brand-700";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const user = await getSessionUser();
  // Inquiries carry personal data — same rule as Application (CLAUDE.md §5
  // Role.EDITOR: "cannot see applications"). Not just gated on mutation.
  if (user?.role !== Role.ADMIN) {
    redirect("/admin");
  }

  const { category: categoryParam, status: statusParam } = await searchParams;
  const category =
    categoryParam && categoryParam in InquiryCategory
      ? (categoryParam as InquiryCategory)
      : undefined;
  const status =
    statusParam && statusParam in InquiryStatus ? (statusParam as InquiryStatus) : undefined;

  const where: Prisma.InquiryWhereInput = {
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
  };

  const inquiries = await db.inquiry.findMany({ where, orderBy: { createdAt: "desc" } });
  const hasFilters = Boolean(category || status);

  return (
    <div className="mx-auto max-w-page">
      <h1 className="text-display-sm mb-6">Inquiries</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium text-ink-700">
            Category
          </label>
          <select id="category" name="category" defaultValue={category ?? ""} className={selectClass}>
            <option value="">All</option>
            {Object.values(InquiryCategory).map((value) => (
              <option key={value} value={value}>
                {INQUIRY_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-ink-700">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className={selectClass}>
            <option value="">All</option>
            {Object.values(InquiryStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-card border border-border-strong px-4 py-2 text-sm text-brand-700"
        >
          Filter
        </button>
        {hasFilters ? (
          <Link href="/admin/inquiries" className="text-sm text-ink-500 underline">
            Clear filters
          </Link>
        ) : null}
      </form>

      {inquiries.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          {hasFilters ? "No inquiries match these filters." : "No inquiries yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                href={`/admin/inquiries/${inquiry.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card) hover:shadow-(--shadow-lift)"
              >
                <div>
                  <p className="font-medium text-ink-800">{inquiry.name}</p>
                  <p className="text-sm text-ink-500">
                    {INQUIRY_CATEGORY_LABELS[inquiry.category]} · {formatDateTime(inquiry.createdAt)}
                  </p>
                </div>
                <span className="rounded-pill border border-border-strong px-3 py-1 text-xs font-medium uppercase text-ink-700">
                  {inquiry.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
