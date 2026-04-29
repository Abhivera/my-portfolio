import { TechIcon } from "./TechIcon";

// Placeholder projects — easy to swap with real GitHub repos later.
const projects = [
  {
    title: "RAG Knowledge Engine",
    description:
      "Production-grade retrieval-augmented generation pipeline with vector search, re-ranking, and contextual chat.",
    tags: ["Python", "LangChain", "pgvector", "FastAPI"],
    accent: "var(--accent)",
    status: "Coming soon",
  },
  {
    title: "Event-Driven Payment Service",
    description:
      "Idempotent payment microservice with Kafka pub/sub, webhook handling, and exactly-once processing semantics.",
    tags: ["Node.js", "Kafka", "PostgreSQL", "Docker"],
    accent: "var(--accent)",
    status: "Case study",
  },
  {
    title: "AI Agent (MCP)",
    description:
      "Multi-step reasoning agent built on Model Context Protocol for autonomous task automation.",
    tags: ["MCP", "LLM", "Python", "Tools"],
    accent: "var(--secondary)",
    status: "In progress",
  },
];

export function Projects() {
  return (
    <section id="projects" className="py-12 sm:py-20 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12 sm:mb-16">
          <div>
            <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
              ※ Selected Work
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
              Things I've built.
            </h2>
          </div>
          <a
            href="https://github.com/Abhivera"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-foreground/70 hover:text-foreground inline-flex items-center gap-2"
          >
            All on GitHub <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((p) => (
            <article
              key={p.title}
              className="group relative rounded-3xl p-5 sm:p-7 bg-card border border-border overflow-hidden shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all"
            >
              <div
                className="absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-30 blur-3xl group-hover:opacity-60 transition-opacity"
                style={{ background: p.accent }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-border"
                    style={{
                      background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                      color: "var(--primary)",
                    }}
                  >
                    {p.status}
                  </span>
                  <span className="text-foreground/40 group-hover:text-foreground transition-colors text-xl">
                    →
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 text-xs font-mono pl-1.5 pr-2 py-1 rounded-full bg-secondary/60 text-foreground/75 border border-border"
                    >
                      <TechIcon name={t} size={11} brandColor />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl p-8 sm:p-10 border-2 border-dashed border-border text-center">
          <p className="font-display text-2xl tracking-tight">
            More projects landing here soon.
          </p>
          <p className="mt-2 text-muted-foreground">
            GitHub repos and live demos will be wired up next.
          </p>
        </div>
      </div>
    </section>
  );
}
