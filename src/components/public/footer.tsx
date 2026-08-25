import Link from "next/link";

const SOCIAL_PLACEHOLDERS = ["Facebook", "Instagram", "X", "LinkedIn"];

export function Footer() {
  return (
    <footer className="on-brand">
      <div className="mx-auto max-w-page px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-lg font-semibold">YouthInTech</p>
            <p className="mt-2 max-w-content text-sm">
              Technology is for everyone — especially YOUth.
            </p>
          </div>

          <div className="text-sm">
            <p className="text-eyebrow uppercase opacity-75">Contact</p>
            <p className="mt-2">
              <a href="mailto:youintech25@gmail.com">youintech25@gmail.com</a>
            </p>
            <p>
              <a href="tel:+260975600929">+260 975 600929</a>
            </p>
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
