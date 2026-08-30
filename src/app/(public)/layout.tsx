import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { SupportChatLauncher } from "@/components/public/support-chat-launcher";
import { MobileNavOpenProvider } from "@/components/public/mobile-nav-open-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // Shared by Header's MobileMenu and SupportChatLauncher — see
    // mobile-nav-open-context.tsx. They're siblings here, not
    // parent/child, so this is the coordination point between them.
    <MobileNavOpenProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-brand-900 focus:shadow-lift"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      {/* Jotform support agent — public pages only, scoped by living in this
          layout rather than the root one (admin is a working tool for
          staff, not a visitor-facing surface, and doesn't need a chat
          widget). The Jotform script itself is loaded by
          SupportChatLauncher only once a visitor clicks it — see that
          component for why: the embed pulls ~18MB of JS unconditionally as
          soon as it runs, incompatible with CLAUDE.md §2's 3G/expensive-data
          assumption if paid by every visitor on every page load. */}
      <SupportChatLauncher />
    </MobileNavOpenProvider>
  );
}
