import { TechIcon } from "./TechIcon";

const jobs = [
  {
    company: "INTELLIOD",
    role: "Software Engineer",
    period: "Sept 2025 — Present",
    current: true,
    points: [
      "Built RAG-based AI pipelines using vector search for contextual chat and recommendation systems",
      "Developed AI agents (MCP architecture) enabling multi-step reasoning and task automation",
      "Designed event-driven AI workflows using Kafka (pub/sub) for scalable asynchronous processing",
      "Optimized embedding & retrieval pipelines for low-latency real-time responses",
      "Established CI/CD and observability with GitHub Actions, Winston, and CloudWatch",
    ],
    stack: ["Python", "Kafka", "RAG", "MCP", "Vector DB", "AWS"],
  },
  {
    company: "MINDCOM TECHNOLOGIES",
    role: "Software Engineer",
    period: "July 2023 — Aug 2025",
    points: [
      "Architected event-driven microservices using Kafka (pub/sub) and SQS, improving system scalability",
      "Designed and optimized APIs handling 100K+ daily requests with async processing",
      "Built payment backend microservices with idempotent processing and webhook-based event flows",
      "Developed an AI concierge system (chatbot + recommendation engine) for user engagement",
      "Improved DB performance via query optimization and indexing (PostgreSQL, MongoDB)",
    ],
    stack: ["Node.js", "FastAPI", "Kafka", "SQS", "PostgreSQL", "Docker"],
  },
];

export function Experience() {
  return (
    <section id="experience" className="py-24 sm:py-32 bg-card/50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-16">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--cinnamon)]">
              ※ Experience
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
              Where I've shipped.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm">
            3+ years building backends and AI systems that handle real production load.
          </p>
        </div>

        <div className="space-y-8">
          {jobs.map((job, i) => (
            <article
              key={job.company}
              className="group relative rounded-3xl p-8 sm:p-10 bg-background border border-border shadow-soft hover:shadow-warm transition-all"
            >
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
 
                  <h3 className="mt-3 font-display text-2xl sm:text-3xl tracking-tight">
                    {job.company}
                  </h3>
                  <p className="mt-1 text-foreground/80">{job.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground font-mono">{job.period}</p>
                </div>

                <div className="lg:col-span-8">
                  <ul className="space-y-3">
                    {job.points.map((p) => (
                      <li key={p} className="flex gap-3 text-foreground/85 leading-relaxed">
                        <span
                          className="mt-2.5 h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: "var(--sunset-orange)" }}
                        />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {job.stack.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 text-xs font-mono pl-2 pr-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border"
                      >
                        <TechIcon name={t} size={12} brandColor />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
