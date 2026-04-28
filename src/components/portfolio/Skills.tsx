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
    title: "APIs & Frontend",
    color: "var(--secondary)",
    items: ["REST", "GraphQL", "gRPC", "Webhooks", "React"],
  },
  {
    title: "Cloud & DevOps",
    color: "var(--muted-foreground)",
    items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Prometheus"],
  },
];

export function Skills() {
  return (
    <section id="skills" className="py-24 sm:py-32 max-w-6xl mx-auto px-6 lg:px-8">
      <div className="mb-16 max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">
          ※ Toolkit
        </span>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
          The tools I reach for.
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g.title}
            className="rounded-2xl p-6 bg-card border border-border hover:border-foreground/30 transition-colors group"
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
                  className="inline-flex items-center gap-2 text-sm pl-2 pr-3 py-1.5 rounded-full bg-background border border-border text-foreground/80 group-hover:border-foreground/30 transition-colors"
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
