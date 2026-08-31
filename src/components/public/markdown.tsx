import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";

// Server-rendered markdown. NO "use client" — this adds nothing to the
// client bundle (CLAUDE.md §2: no heavy client-side JS on public pages).
//
// Raw HTML is disabled on purpose: `rehype-raw` is deliberately NOT wired
// in, so any HTML in the source is inert, and `skipHtml` drops it entirely
// rather than escaping it into visible text. Only admins write this content,
// but a renderer that passes HTML through is a script-injection hole with no
// upside here. react-markdown's default `urlTransform` also neutralises
// `javascript:` and other dangerous URLs in links/images.
//
// Styled directly with design tokens — no typography plugin. Headings use
// the display font, links are brand-600, paragraphs get real spacing, and
// the whole block is capped near 65ch for a comfortable measure.

// remark-breaks: a single newline becomes <br>, matching what a
// non-technical editor expects when they press Enter once. Paragraphs still
// need a blank line between them.
const remarkPlugins = [remarkBreaks];

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mb-3 mt-8 font-display text-display-sm text-brand-700 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 font-display text-display-sm text-brand-700 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 font-display text-lg font-semibold text-brand-700 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 font-display text-base font-semibold text-brand-800 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => <p className="my-4 text-ink-700 first:mt-0 last:mb-0">{children}</p>,
  a: ({ href, children }) => {
    const external = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className="text-brand-600 underline underline-offset-2 hover:text-brand-800"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="my-4 flex list-disc flex-col gap-1.5 pl-6 text-ink-700 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 flex list-decimal flex-col gap-1.5 pl-6 text-ink-700 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-brand-200 pl-4 italic text-ink-600 first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-card bg-ink-900 p-4 text-sm text-ink-50 first:mt-0 last:mb-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-ink-50">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-brand-50 px-1.5 py-0.5 text-[0.9em] text-brand-800">{children}</code>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink-800">{children}</strong>,
  hr: () => <hr className="my-8 border-border" />,
};

// Images are dropped from the body on purpose. An `<img>` from arbitrary
// markdown can't go through next/image (its src isn't on the remote-pattern
// allowlist) and would bypass every image-size discipline CLAUDE.md §2
// insists on. Editors set imagery through the cover-image field, which does
// go through the Cloudinary pipeline.
const disallowedElements = ["img"];

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`max-w-[65ch] ${className ?? ""}`}>
      <ReactMarkdown
        skipHtml
        remarkPlugins={remarkPlugins}
        disallowedElements={disallowedElements}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
