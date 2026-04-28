export function Contact() {
  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div
          className="relative rounded-[2.5rem] p-10 sm:p-16 lg:p-24 overflow-hidden grain shadow-glow"
          style={{ background: "var(--gradient-sunset)" }}
        >
          <div
            className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent)" }}
          />
          <div className="relative max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--green-50)]/80">
              ※ Get in touch
            </span>
            <h2
              className="mt-4 font-display text-5xl sm:text-7xl tracking-tight leading-[1]"
              style={{ color: "var(--primary-foreground)" }}
            >
              Let's build
              <br />
              something <em className="not-italic" style={{ color: "var(--green-50)" }}>great.</em>
            </h2>
            <p className="mt-8 text-lg sm:text-xl max-w-xl" style={{ color: "var(--green-50)" }}>
              Have a backend challenge or an AI idea you want to ship? Drop a message — I usually
              reply within a day.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <a
                href="mailto:abhijitakadeveloper@gmail.com"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-full bg-white text-[color:var(--primary)] font-semibold shadow-warm hover:bg-[color:var(--green-50)] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
                abhijitakadeveloper@gmail.com
                <span aria-hidden>→</span>
              </a>
              <a
                href="tel:+918707795477"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-full bg-white/12 text-white border border-white/25 font-medium hover:bg-white/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.58l2.2-2.2a1 1 0 0 0 .24-1.02A11.4 11.4 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z" />
                </svg>
                +91 87077 95477
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-3 text-sm text-white/85">
              <a
                href="https://www.linkedin.com/in/abhijit-verma-532996165/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="https://github.com/Abhivera"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Abhijit Verma. Crafted with care.</p>
          <p className="font-mono">backend × genai</p>
        </footer>
      </div>
    </section>
  );
}
