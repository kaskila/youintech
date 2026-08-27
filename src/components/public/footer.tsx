import Image from "next/image";
import Link from "next/link";
import { House, Layers, Rocket, Info, Mail, Phone, MapPin } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { FacebookIcon, LinkedinIcon, TiktokIcon } from "./social-icons";

const EXPLORE_LINKS = [
  { href: "/", label: "Home", icon: House },
  { href: "/our-sectors", label: "Our Sectors", icon: Layers },
  { href: "/programmes", label: "Programmes", icon: Rocket },
  // No /about page yet — matches the header nav's existing /about link
  // (nav-items.ts). 404 until that page ships.
  { href: "/about", label: "About", icon: Info },
] as const;

const SOCIAL_ICONS = {
  Facebook: FacebookIcon,
  LinkedIn: LinkedinIcon,
  TikTok: TiktokIcon,
} as const;

export function Footer() {
  return (
    <footer className="bg-ink-50 text-ink-700">
      <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo_2.png" alt="" width={40} height={40} className="h-10 w-10" />
              <span className="font-display text-lg font-semibold text-brand-900">
                YouthInTech
              </span>
            </Link>
            <p className="mt-3 max-w-content text-sm text-ink-600">
              We equip young people with digital skills. Create opportunities and empower them to solve real problems in their communities and beyond.
            </p>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase text-ink-900">Explore</p>
            <span aria-hidden="true" className="mt-2 block h-0.5 w-8 bg-brand-700" />
            <ul className="mt-4 flex flex-col gap-2.5">
              {EXPLORE_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="h-4 w-4 text-brand-700" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase text-ink-900">Get in touch</p>
            <span aria-hidden="true" className="mt-2 block h-0.5 w-8 bg-brand-700" />
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a href="mailto:youintech25@gmail.com" className="flex items-center gap-2">
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
                  youintech25@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+260975600929" className="flex items-center gap-2">
                  <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
                  +260 975 600929
                </a>
              </li>
              <li className="flex items-center gap-2 text-ink-600">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
                Lusaka, Zambia
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase text-ink-900">Follow us</p>
            <span aria-hidden="true" className="mt-2 block h-0.5 w-8 bg-brand-700" />
            <ul className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map(({ name, href }) => {
                const Icon = SOCIAL_ICONS[name];
                return (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-700 text-brand-700 transition hover:bg-brand-700 hover:text-white"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-ink-600 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} YouthInTech (Zambia Youths in Technology
            Network).
          </p>
          <nav aria-label="Legal">
            <ul className="flex gap-4">
              {/* TODO: build /privacy and /terms — CLAUDE.md §9 credibility/
                  polish slices. These routes 404 until then. */}
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
