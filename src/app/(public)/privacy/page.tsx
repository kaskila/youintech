import type { Metadata } from "next";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/lib/validations/inquiry";
import { RETENTION_MONTHS } from "@/lib/retention";

// This version string MUST match CURRENT_PRIVACY_POLICY_VERSION exactly —
// that's the whole reason this page exists (see validations/inquiry.ts).
// Bump both together when this policy changes; never edit this page's
// substance without bumping the version, and never overwrite a version a
// real Inquiry/Application row already cites.
const VERSION = CURRENT_PRIVACY_POLICY_VERSION;
const LAST_UPDATED = "30 August 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What YouthInTech collects through this site, why, how long we keep it, and how to exercise your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Privacy</p>
      <h1 className="mt-2 text-display-md">Privacy Policy</h1>
      <p className="mt-4 text-sm text-ink-500">
        Version {VERSION} · Last updated {LAST_UPDATED}
      </p>

      <p className="mt-6 text-lead text-ink-600">
        This page describes, in plain language, what YouthInTech (Zambia Youths in
        Technology Network) actually collects through this website, why, and what we do
        with it. It is not a template, it describes this specific system.
      </p>

      <div className="mt-4 rounded-card border border-border bg-surface-subtle p-4 text-sm text-ink-700">
        We are not lawyers, and no one on our team is a legal specialist in Zambia&apos;s
        data protection law. This policy describes our actual practice in plain terms
        rather than citing legal provisions we can&apos;t verify. We intend to have it
        reviewed by someone with that expertise as the organisation grows.
      </div>

      <h2 className="mt-10 text-display-sm">What we collect, and why</h2>

      <h3 className="mt-6 font-display text-lg font-semibold text-brand-900">
        Contact form (/contact)
      </h3>
      <p className="mt-2 text-ink-700">
        When you send us a message, we collect: what your message is about (volunteer,
        partner, support, or general), your name, email, phone (optional), organisation
        (optional), and the message itself. We use this to read, route, and reply to
        your message.
      </p>
      <p className="mt-3 text-ink-700">
        We also ask your age range, and only if you tell us you&apos;re under 18, a
        parent or guardian&apos;s name and email, and their explicit consent. See
        &ldquo;Under 18 submissions and guardian consent&rdquo; below for why.
      </p>

      <h3 className="mt-6 font-display text-lg font-semibold text-brand-900">
        Volunteer (&ldquo;Frontliner&rdquo;) applications
      </h3>
      <p className="mt-2 text-ink-700">
        This form is not live on the site yet. When it is, we plan to collect: your full
        name, email, phone, city, institution (school, university, or employer), age
        range, skills, which sector(s) you&apos;re interested in, and your motivation for
        applying to evaluate and respond to your application. We&apos;ll update this
        policy&apos;s version when that happens.
      </p>

      <h3 className="mt-6 font-display text-lg font-semibold text-brand-900">
        Everything else on the site
      </h3>
      <p className="mt-2 text-ink-700">
        Browsing the public pages, sectors, programmes, opportunities, news, events —
        doesn&apos;t require an account and doesn&apos;t submit any personal information.
        We don&apos;t run analytics or advertising trackers on this site.
      </p>

      <h2 className="mt-10 text-display-sm">Our basis for processing it</h2>
      <p className="mt-4 text-ink-700">
        We rely on your consent: you tick a box, separate from anything else on the
        form, before we process what you&apos;ve submitted. Nothing is pre-ticked. For
        anyone under 18, we additionally rely on a parent or guardian&apos;s consent,
        given separately see below.
      </p>
      <p className="mt-3 text-ink-700">
        {/* TODO: legal review — confirm this is the correct/sufficient lawful basis
            under Zambia's Data Protection Act No. 3 of 2021, and whether any
            processing here should instead rely on legitimate interest or another
            basis. Do not cite specific sections on this page until that review
            has actually happened. */}
        You can withdraw consent at any time, see &ldquo;Your rights&rdquo; below. Withdrawing
        doesn&apos;t affect anything we did before you withdrew it.
      </p>

      <h2 className="mt-10 text-display-sm">Who can see it</h2>
      <p className="mt-4 text-ink-700">
        A small number of authorised officers. Concretely: in our admin system, only
        accounts with the Administrator role can view contact-form messages or
        volunteer applications. Staff with an Editor-level account, who can publish
        news, events, and programmes, cannot see this data at all; that restriction is
        enforced in the software itself, not left to policy.
      </p>

      <h2 className="mt-10 text-display-sm">How long we keep it</h2>
      <p className="mt-4 text-ink-700">
        We keep what you submit for {RETENTION_MONTHS} months from your last contact
        with us. After that, we remove the personally identifying parts of the record 
        your name, contact details, message, and any guardian information. We may keep
        a de-identified count for basic reporting (e.g. how many messages we received in
        a given period), but it will no longer identify you.
      </p>

      <h2 className="mt-10 text-display-sm">Third parties and international transfer</h2>
      <p className="mt-4 text-ink-700">
        We don&apos;t sell or share your information with third parties for their own
        purposes. We do use a small number of service providers to run this site, and
        your information is processed on their servers, which are <strong>outside
        Zambia</strong>:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-700">
        <li>
          <strong>Neon</strong> our database. Contact-form messages and volunteer
          applications are stored here.
        </li>
        <li>
          <strong>Vercel</strong> hosts this website and runs the code that handles
          your submission.
        </li>
        <li>
          <strong>Cloudinary</strong> stores the images you see on the site (sector
          and programme photos, for example). Cloudinary does not receive the personal
          information you submit through our forms only images our own staff upload.
        </li>
      </ul>

      <h2 className="mt-10 text-display-sm">Under-18 submissions and guardian consent</h2>
      <p className="mt-4 text-ink-700">
        We don&apos;t turn young people away for being young, reaching them is the
        point of this organisation. But if you tell us you&apos;re between 16 and 17, we
        require a parent or guardian&apos;s name, email, and explicit consent before we
        process your message. That consent checkbox is never pre-ticked, and a
        submission missing any of these three things is rejected by our system, not
        just discouraged in the form.
      </p>
      <p className="mt-3 text-ink-700">
        Our age options on the form start at &ldquo;16-17&rdquo; we don&apos;t currently have a
        way to distinguish an under-16 submission from that bracket. If you&apos;re
        younger than 16, please ask a parent or guardian to send the message using
        their own details instead.
      </p>

      <h2 className="mt-10 text-display-sm">Your rights, and how to exercise them</h2>
      <p className="mt-4 text-ink-700">You can ask us to:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-700">
        <li>tell you what information we hold about you;</li>
        <li>correct it, if it&apos;s wrong;</li>
        <li>delete it, or anonymise it sooner than the retention period above;</li>
        <li>withdraw your consent to our processing it going forward.</li>
      </ul>
      <p className="mt-3 text-ink-700">
        A parent or guardian can exercise any of these on behalf of a young person under
        18. To do any of this, email us, see &ldquo;Contact&rdquo; below. We&apos;ll respond from
        the same address.
      </p>

      <h2 className="mt-10 text-display-sm">Contact</h2>
      <p className="mt-4 text-ink-700">
        Questions about this policy, or a request under &ldquo;Your rights&rdquo; above:{" "}
        <a href="mailto:youintech25@gmail.com" className="underline">
          youintech25@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
