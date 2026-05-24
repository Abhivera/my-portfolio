export function Contact() {
  return (
    <section id="contact" className="py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl sm:rounded-[2.5rem] px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16 overflow-hidden grain shadow-glow"
          style={{
            background:
              "linear-gradient(135deg, #08292f 0%, color-mix(in oklab, var(--aqua-700) 88%, #001215) 54%, #1b7a85 100%)",
          }}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div
            className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent)" }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 lg:items-center">
            <div>
              <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-50)]">
                ※ Get in touch
              </span>
              <h2
                className="mt-4 font-display text-4xl sm:text-7xl tracking-tight leading-[1]"
                style={{ color: "var(--primary-foreground)" }}
              >
                Let's build
                <br />
                something <em className="not-italic" style={{ color: "var(--aqua-50)" }}>great.</em>
              </h2>
              <p
                className="mt-6 sm:mt-8 text-base sm:text-xl font-medium leading-relaxed max-w-xl"
                style={{ color: "var(--aqua-50)" }}
              >
                Have a backend challenge or an AI idea you want to ship? Drop a message, I usually
                reply within a day.
              </p>
            </div>

            <div className="flex w-full flex-col items-stretch justify-center lg:py-2">
              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:mt-0 sm:gap-3 lg:mt-0">
                <a
                  href="mailto:abhijitakadeveloper@gmail.com"
                  className="inline-flex min-h-14 w-full min-w-0 items-center justify-center gap-2 px-3 py-3 sm:px-4 rounded-full bg-white/16 backdrop-blur-sm text-white border border-white/35 font-medium text-xs sm:text-sm leading-snug shadow-warm hover:bg-white/24 transition-colors whitespace-normal text-center"
                >
                  <svg viewBox="0 0 24 24" fill="#EA4335" className="h-4 w-4 shrink-0" aria-hidden>
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  <span className="min-w-0 break-words">abhijitakadeveloper@gmail.com</span>
                </a>
                <a
                  href="https://wa.me/918707795477"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Contact me on WhatsApp at 8707795477"
                  className="inline-flex min-h-14 w-full min-w-0 items-center justify-center gap-2.5 px-4 py-2.5 rounded-full bg-white/16 backdrop-blur-sm text-white border border-white/35 font-semibold text-sm shadow-warm hover:bg-white/24 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
                    <path
                      fill="#25D366"
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg>
                  <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                    <span className="text-sm font-semibold tabular-nums">8707795477</span>
                  </span>
                </a>
                <a
                  href="https://www.linkedin.com/in/abhijit-verma/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex min-h-14 w-full min-w-0 items-center justify-center gap-2 px-3 sm:px-5 rounded-full bg-white/16 backdrop-blur-sm text-white border border-white/35 font-semibold text-sm shadow-warm hover:bg-white/24 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="#0A66C2" className="h-4 w-4 shrink-0" aria-hidden>
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
                <a
                  href="https://github.com/Abhivera"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="inline-flex min-h-14 w-full min-w-0 items-center justify-center gap-2 px-3 sm:px-5 rounded-full bg-white/16 backdrop-blur-sm text-white border border-white/35 font-semibold text-sm shadow-warm hover:bg-white/24 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="#181717" className="h-4 w-4 shrink-0 rounded-full bg-white" aria-hidden>
                    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Abhijit Verma. Crafted with care.</p>
        </footer>
      </div>
    </section>
  );
}
