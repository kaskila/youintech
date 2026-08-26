import Link from "next/link";

const SOCIAL_PLACEHOLDERS = ["Facebook", "Instagram", "X", "LinkedIn"];

export function Footer() {
  return (
    <footer className="on-brand">
      <div className="mx-auto max-w-page px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold">YouthInTech</p>
            <p className="mt-2 max-w-content text-sm">
              Technology is for everyone — especially YOUth.
            </p>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase opacity-75">Explore</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/our-sectors">Our Sectors</Link>
              </li>
              <li>
                <Link href="/programmes">Programmes</Link>
              </li>
              <li>
                {/* No /about page yet — matches the header nav's existing
                    /about link (nav-items.ts). 404 until that page ships. */}
                <Link href="/about">About</Link>
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase opacity-75">Get in touch</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li>
                <Link href="/contact">Contact us</Link>
              </li>
              <li>
                <a href="mailto:youintech25@gmail.com">youintech25@gmail.com</a>
              </li>
              <li>
                <a href="tel:+260975600929">+260 975 600929</a>
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase opacity-75">Follow</p>
            {/* Social placeholders — real links land with the credibility
                slice, CLAUDE.md §9. */}
            <ul className="mt-2 flex gap-3">
              {SOCIAL_PLACEHOLDERS.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-brand-100/20 pt-6 text-sm md:flex-row md:items-center md:justify-between">
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
