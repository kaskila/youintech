// lucide-react (installed: 1.34.0) ships no brand/logo icons at all — not
// Facebook, not LinkedIn, not TikTok. Verified against its own type defs
// (node_modules/lucide-react/dist/lucide-react.d.ts has no "Facebook",
// "Linkedin", or "Tiktok" export). So all three are hand-drawn here, sized
// and coloured the same way (24x24 viewbox, fill="currentColor") so they
// sit identically inside the footer's icon tiles.
type IconProps = {
  className?: string;
};

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22.675 0h-21.35C.6 0 0 .6 0 1.325v21.351C0 23.4.6 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.098 2.795.142v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.676V1.325C24 .6 23.4 0 22.675 0z" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82c-1.12-1.08-1.67-2.64-1.75-4.17h-3.9v13.9c0 1.7-1.38 3.08-3.08 3.08a3.08 3.08 0 0 1-3.08-3.08 3.08 3.08 0 0 1 3.08-3.08c.29 0 .58.04.85.12v-3.95a6.95 6.95 0 0 0-.85-.05A7 7 0 0 0 1 15.57a7 7 0 0 0 7 7 7 7 0 0 0 7-7V8.92a9.14 9.14 0 0 0 5.6 1.9v-3.9c0-.01-2.87.1-4-.9z" />
    </svg>
  );
}
