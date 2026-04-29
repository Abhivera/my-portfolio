import { useEffect, useState } from "react";
import { Terminal, Mail } from "lucide-react";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-soft"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-sunset shadow-warm flex items-center justify-center text-primary-foreground group-hover:rotate-3 transition-transform duration-300">
            <Terminal size={20} />
          </span>
          <span className="font-display text-lg sm:text-2xl tracking-tight font-semibold">
            Abhijit<span className="text-[color:var(--accent)]">.</span>
          </span>
        </a>
        <ul className="hidden md:flex items-center gap-2 text-base">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="px-4 py-2.5 rounded-full text-foreground/80 hover:text-foreground hover:bg-card/60 hover:shadow-sm transition-all duration-200 font-medium"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="mailto:abhijitakadeveloper@gmail.com"
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:shadow-glow transition-all duration-300"
        >
          Let's talk
          <span aria-hidden>→</span>
        </a>
        <a
          href="mailto:abhijitakadeveloper@gmail.com"
          className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft"
          aria-label="Email"
        >
          <Mail size={18} />
        </a>
      </nav>
    </header>
  );
}
