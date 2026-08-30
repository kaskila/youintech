import type { Metadata } from "next";

const LAST_UPDATED = "30 August 2026";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using the YouthInTech website.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Terms</p>
      <h1 className="mt-2 text-display-md">Terms of Use</h1>
      <p className="mt-4 text-sm text-ink-500">Last updated {LAST_UPDATED}</p>

      <p className="mt-6 text-lead text-ink-600">
        These terms cover your use of this website, operated by YouthInTech (Zambia
        Youths in Technology Network). There are no accounts, no payments, and no user
        content on this site, just information, and a form to contact us, so these
        terms are short.
      </p>

      <h2 className="mt-10 text-display-sm">Acceptable use</h2>
      <p className="mt-4 text-ink-700">
        Use this site for its intended purpose: to learn about our sectors, programmes,
        opportunities, and events, and to get in touch with us. Don&apos;t try to
        disrupt the site (scraping it aggressively, attempting to bypass its security,
        or overloading it), submit false information through the contact form, or
        impersonate someone else when doing so.
      </p>

      <h2 className="mt-10 text-display-sm">Intellectual property</h2>
      <p className="mt-4 text-ink-700">
        The text, logo, and images on this site belong to YouthInTech, or are used with
        the permission of whoever they belong to (a partner&apos;s logo, for instance).
        You&apos;re welcome to read, share, and link to this site. You may not
        republish, redistribute, or reuse our content for your own commercial purposes
        without asking us first.
      </p>

      <h2 className="mt-10 text-display-sm">External links</h2>
      <p className="mt-4 text-ink-700">
        This site links out to other organisations&apos; websites, an opportunity&apos;s
        application page, a programme&apos;s registration form, a partner&apos;s site,
        our social media. We don&apos;t control those sites and aren&apos;t responsible
        for their content, availability, or how they handle your information once
        you&apos;ve left ours. Check their own terms and privacy policy before you
        submit anything to them.
      </p>

      <h2 className="mt-10 text-display-sm">No warranty</h2>
      <p className="mt-4 text-ink-700">
        We try to keep the information on this site, programme statuses, opportunity
        deadlines, event dates, accurate and current, but we don&apos;t guarantee it.
        Before you rely on a deadline or a date for something important, confirm it
        directly with the organisation offering it, or with us.
      </p>

      <h2 className="mt-10 text-display-sm">Governing law</h2>
      <p className="mt-4 text-ink-700">
        This site is operated from Zambia, and Zambian law governs your use of it.
      </p>

      <h2 className="mt-10 text-display-sm">Changes to these terms</h2>
      <p className="mt-4 text-ink-700">
        We may update these terms as the site changes. The date at the top of this page
        tells you when they last changed.
      </p>

      <h2 className="mt-10 text-display-sm">Contact</h2>
      <p className="mt-4 text-ink-700">
        Questions about these terms:{" "}
        <a href="mailto:youintech25@gmail.com" className="underline">
          youintech25@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
