

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex items-center pt-24 pb-12 sm:pt-36 sm:pb-16 lg:pb-20 overflow-hidden grain"
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-44 -right-52 sm:-top-40 sm:-right-40 h-[500px] w-[500px] rounded-full opacity-35 sm:opacity-40 blur-3xl motion-safe:animate-[float_6s_ease-in-out_infinite]"
        style={{ background: "var(--gradient-sunset)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 sm:-bottom-36 sm:-left-32 h-[500px] w-[500px] rounded-full opacity-25 sm:opacity-30 blur-3xl motion-safe:animate-[float_7s_ease-in-out_infinite_reverse]"
        style={{ background: "var(--gradient-ai)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid xl:grid-cols-12 gap-10 items-start">
          <div className="xl:col-span-7">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              <span className="text-sm font-mono text-foreground/80 tracking-wide uppercase">
                Available for opportunities
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-border/60"
                style={{
                  background: "color-mix(in oklab, var(--accent) 18%, var(--surface))",
                  color: "var(--primary)",
                }}
              > AI Software  Engineer
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              Building <em className="text-gradient-sunset not-italic">scalable</em>
              <br />
              backends &amp;
              <br />
              <span
                className="inline-block px-3 py-1 rounded-2xl border border-border"
                style={{
                  background: "color-mix(in oklab, var(--accent) 22%, var(--surface))",
                  color: "var(--primary)",
                }}
              >
                GenAI
              </span>{" "}
              systems.
            </h1>

            <p className="mt-8 sm:mt-10 max-w-2xl text-base sm:text-xl text-muted-foreground leading-relaxed">
              Hi, I'm <strong className="text-foreground font-semibold">Abhijit Verma</strong> a
              software engineer with 3+ years building event-driven microservices, high-performance
              APIs, and production-grade RAG &amp; AI agent systems.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap lg:flex-nowrap items-center gap-3 sm:gap-4">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium whitespace-nowrap shadow-warm hover:shadow-glow hover:-translate-y-0.5 transition-all"
          >
            View My Projects
            <span aria-hidden>↓</span>
          </a>

          <a
            href="https://www.linkedin.com/in/abhijit-verma-532996165"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/15 hover:border-foreground/40 font-medium whitespace-nowrap transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="#0A66C2" className="w-4 h-4">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
            LinkedIn
          </a>
          <a
            href="https://github.com/Abhivera"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/15 hover:border-foreground/40 font-medium whitespace-nowrap transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="#181717" className="w-4 h-4">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
            GitHub
          </a>
            </div>
          </div>

          <div className="hidden xl:block xl:col-span-5">
            <div className="rounded-3xl border border-border bg-card shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">prod-terminal</span>
              </div>
              <pre className="text-sm font-mono leading-relaxed text-foreground/85 whitespace-pre-wrap">
{`$ whoami
abhijit-verma

$ stack --focus
Databases, AI Agents, Node.js, FastAPI, AWS

$ status
Shipping products and AI solutions`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
