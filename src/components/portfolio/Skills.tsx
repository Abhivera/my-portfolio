import { TechIcon } from "./TechIcon";

const groups = [
  {
    title: "Backend",
    color: "var(--secondary)",
    items: ["Python", "Node.js", "FastAPI", "Express", "Microservices"],
  },
  {
    title: "Event Systems",
    color: "var(--accent)",
    items: ["Apache Kafka", "AWS SQS", "Pub/Sub", "Event-Driven"],
  },
  {
    title: "Databases",
    color: "var(--primary)",
    items: ["PostgreSQL", "Redis", "DynamoDB", "MongoDB"],
  },
  {
    title: "Generative AI",
    color: "var(--accent)",
    items: ["RAG", "LangChain", "Vector Search", "AI Agents (MCP)", "Claude", "HuggingFace"],
  },
  {
    title: "Frontend & APIs",
    color: "var(--secondary)",
    items: ["REST", "GraphQL", "gRPC", "Webhooks", "React", "Next.js"],
  },
  {
    title: "Cloud & DevOps",
    color: "var(--muted-foreground)",
    items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Prometheus"],
  },
];

export function Skills() {
  return (
    <section id="skills" className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 sm:mb-16 max-w-2xl">
        <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
          ※ Skillset
        </span>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
          The skills I possess
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g.title}
            className="rounded-2xl p-5 sm:p-6 bg-card border border-border shadow-soft hover:shadow-warm hover:-translate-y-1 transition-all group"
          >
            <div className="flex items-center">
              <h3
                className="font-display text-xl pb-1 border-b-2"
                style={{ borderBottomColor: g.color }}
              >
                {g.title}
              </h3>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {g.items.map((it) => (
                <li
                  key={it}
                  className="inline-flex items-center gap-2 text-sm pl-2 pr-3 py-1.5 rounded-full bg-secondary/70 border border-border text-foreground/80 group-hover:border-foreground/30 transition-colors"
                >
                  <TechIcon name={it} size={14} brandColor />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
