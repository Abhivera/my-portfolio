import { TechIcon } from "./TechIcon";

type ProjectLink = { label: string; href: string };

type Project = {
  title: string;
  tagline?: string;
  description: string;
  tags: string[];
  accent: string;
  status: string;
  links?: ProjectLink[];
  /** Where the whole card navigates (defaults to the first `links` entry). */
  cardHref?: string;
  /** Public URL (e.g. `/file.png` from `public/`) */
  iconSrc?: string;
  iconAlt?: string;
};

function projectCardHref(p: Project): string | undefined {
  return p.cardHref ?? p.links?.[0]?.href;
}

const projects: Project[] = [
  {
    title: "Calovia",
    tagline: "AI Nutrition Platform",
    description:
      "Shipped multimodal meal photo → LLM → structured nutrition output (calories, macros, meal name, exercise hints) behind a provider-abstracted vision service (OpenAI-compatible / Gemini / Bedrock). Owned the FastAPI pipeline (upload, analysis persistence, public rate-limited demo API) and domain APIs that consume model output for net calories, streaks, and meal history. React/Redux client surfaces analysis results, meal logging, and Chart.js analytics over the REST API.",
    tags: ["FastAPI", "React", "Redux", "LLM", "PostgreSQL"],
    accent: "var(--accent)",
    status: "Product",
    links: [
      { label: "Calovia", href: "https://calovia.app" },
      { label: "Frontend", href: "https://github.com/Abhivera/calovia-frontend" },
      { label: "Backend", href: "https://github.com/Abhivera/calovia-backend" },
    ],
    cardHref: "https://calovia.app",
    iconSrc: "/calovia-logo.png",
    iconAlt: "Calovia — bowl with fresh meal ingredients",
  },
  {
    title: "Streammeo",
    tagline: "AI customer service & ticketing platform",
    description:
      "One support desk that unifies email, live chat, web forms, and API channels into a single ticket queue, so agents never switch tools mid-shift. Claude drafts suggested replies from ticket context for agents to review and send, while SLA policies flag first-response and resolution breaches automatically on tickets and in the dashboard. Real-time collaboration shows who is viewing or typing to cut duplicate replies, an embeddable chat widget converts visitor sessions into tickets, and a self-service portal lets customers track and rate their own tickets. Tiered plans with Razorpay billing for growing SaaS support teams.",
    tags: ["React", "Node.js", "TypeScript", "Anthropic", "Razorpay"],
    accent: "var(--accent)",
    status: "Product",
    links: [
      { label: "Streammeo", href: "https://streammeo.com" },
      { label: "POC on GitHub", href: "https://github.com/Abhivera/streammeo" },
    ],
    iconSrc: "/streammeo-logo.png",
    iconAlt: "Streammeo — microphone and sound waves mark",
  },
  {
    title: "GitClaw",
    tagline: "Self-hosted AI pull request reviewer",
    description:
      "An open source, self-hosted AI reviewer that reads your diffs, not your code, so nothing ever leaves your infrastructure. Webhooks fire on open and update, and GitClaw diffs only what changed to leave inline comments on the lines that matter: injection risks and unsafe patterns, hot-path performance regressions, and maintainability issues like complexity and duplication. Reply to @gitclaw in a PR comment for in-context follow-ups, tune behavior per repo with a .gitclaw.yaml, and track recurring findings across teams in a dashboard. Pluggable AI backend works with OpenRouter, Anthropic (Claude), Groq, any OpenAI-compatible endpoint, or a local Ollama instance. MIT licensed.",
    tags: ["GitHub", "GitLab", "Bitbucket", "LLM", "Self-hosted"],
    accent: "var(--accent)",
    status: "Open source",
    links: [
      { label: "GitClaw", href: "https://gitclaw.online" },
      { label: "Open source on GitHub", href: "https://github.com/Abhivera/gitclaw" },
    ],
    iconSrc: "/gitclaw-icon.png",
    iconAlt: "GitClaw — lobster claw and git mark",
  },
];

export function Projects() {
  return (
    <section id="projects" className="py-12 sm:py-20 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12 sm:mb-16">
          <div>
            <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
              ※ Projects
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
              Personal Projects.
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

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {projects.map((p) => {
            const href = projectCardHref(p);
            const cardIsLink = Boolean(href);

            return (
            <article
              key={p.title}
              className={`group relative rounded-3xl p-5 sm:p-7 bg-card border border-border overflow-hidden shadow-soft transition-all ${
                cardIsLink
                  ? "cursor-pointer hover:shadow-glow hover:-translate-y-1"
                  : "hover:shadow-glow hover:-translate-y-1"
              }`}
            >
              {cardIsLink ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 z-10 rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--aqua-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="sr-only">
                    Open {p.title}
                    {p.tagline ? ` — ${p.tagline}` : ""} (opens in new tab)
                  </span>
                </a>
              ) : null}
              <div
                className="absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-30 blur-3xl group-hover:opacity-60 transition-opacity pointer-events-none"
                style={{ background: p.accent }}
              />
              <div
                className={`relative z-20 flex flex-row gap-5 sm:gap-8 items-center ${
                  cardIsLink ? "pointer-events-none" : ""
                }`}
              >
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-2.5 shadow-sm sm:h-32 sm:w-32 sm:p-3">
                  {p.iconSrc ? (
                    <img
                      src={p.iconSrc}
                      alt={p.iconAlt ?? ""}
                      width={128}
                      height={128}
                      className="max-h-full max-w-full object-contain object-center"
                    />
                  ) : (
                    <div
                      className="flex size-full min-h-0 items-center justify-center rounded-xl bg-secondary/55 font-display text-2xl tracking-tight text-muted-foreground sm:text-3xl"
                      aria-hidden
                    >
                      {p.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-border"
                      style={{
                        background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      {p.status}
                    </span>
                    <span className="text-foreground/40 group-hover:text-foreground transition-colors text-xl shrink-0">
                      →
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl tracking-tight">{p.title}</h3>
                  {p.tagline ? (
                    <p className="mt-1 text-sm text-muted-foreground/90 leading-snug">{p.tagline}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                  {p.links?.length ? (
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
                      {p.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs font-medium text-[color:var(--aqua-700)] hover:text-foreground underline-offset-2 hover:underline ${
                            cardIsLink ? "pointer-events-auto relative z-20" : ""
                          }`}
                        >
                          {link.label}
                          <span aria-hidden className="ml-0.5 opacity-60">
                            ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}
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
              </div>
            </article>
            );
          })}
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
