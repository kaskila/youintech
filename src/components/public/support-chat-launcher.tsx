"use client";

import { useState } from "react";
import Script from "next/script";
import { MessageCircle, Loader2 } from "lucide-react";
import { useMobileNavOpen } from "./mobile-nav-open-context";

// Jotform's AI Agent embed does NOT lazy-load internally — once embed.js
// runs, it eagerly pulls its full chat application (~18MB of JS across ~45
// requests, measured against this exact embed URL), regardless of whether
// anyone ever opens the chat. That's flatly incompatible with CLAUDE.md §2
// ("assume 3G, expensive data... no heavy client-side JS on public pages")
// if loaded for every visitor on every page load — see the task this
// component was built for. So the cost is paid ONLY by someone who
// deliberately clicks to start a chat, never by a passive visitor: nothing
// Jotform-related is requested until `activated` flips true.
const JOTFORM_EMBED_SRC =
  "https://cdn.jotfor.ms/agent/embedjs/019951a1fd0c7220bdc72d89988f2d1c571a/embed.js";

export function SupportChatLauncher() {
  const [activated, setActivated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // The mobile nav panel expands inline (not an overlay — see MobileMenu),
  // which can push a hero CTA right into this button's bottom-right corner
  // on short viewports. Hiding the button while the panel is open is a
  // deterministic fix for that specific, reproducible overlap — see the
  // task this was built for. The Script tag below is NOT gated on this: an
  // in-flight or completed Jotform load must never be interrupted just
  // because someone toggled the nav.
  const { isOpen: mobileNavOpen } = useMobileNavOpen();

  // Once Jotform's own script has run, it renders its own floating launcher
  // in this same corner — hide ours so the two don't stack. If it somehow
  // doesn't (a network hiccup after embed.js's own onLoad fires), our
  // button simply doesn't come back; that's an acceptable edge case for a
  // one-time, user-initiated action, not a passive page-load failure.
  const showButton = !(activated && loaded) && !mobileNavOpen;

  return (
    <>
      {showButton ? (
        <button
          type="button"
          onClick={() => setActivated(true)}
          disabled={activated}
          aria-busy={activated}
          aria-label={activated ? "Loading chat" : "Chat with us"}
          className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-(--shadow-lift) transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-90"
        >
          {activated ? (
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
          ) : (
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
          )}
        </button>
      ) : null}

      {activated ? (
        <Script src={JOTFORM_EMBED_SRC} strategy="afterInteractive" onReady={() => setLoaded(true)} />
      ) : null}
    </>
  );
}
