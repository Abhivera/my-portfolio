export function About() {
  return (
    <section id="about" className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="sticky top-28">
            <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
              ※ About
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
              Engineer with
              <br />
              <em className="text-gradient-sunset not-italic">a builder's mindset.</em>
            </h2>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6 text-base sm:text-lg leading-relaxed text-foreground/85">
          <p>
            I design and build the backbone of modern applications — from event-driven microservices
            handling hundreds of thousands of requests, to AI agents that reason, retrieve, and act
            in real-time.
          </p>
          <p>
            My focus sits at the intersection of <strong>backend reliability</strong> and{" "}
            <strong>generative AI</strong>: production-grade RAG pipelines, vector search,
            multi-step agents using MCP, and the boring-but-critical infrastructure that keeps it
            all running — Kafka, queues, observability, CI/CD.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-6">
            {[
              {
                t: "Backend Architecture",
                d: "Event-driven systems with Kafka, SQS & microservices.",
                color: "var(--secondary)",
              },
              {
                t: "Generative AI",
                d: "RAG, LangChain, vector search & autonomous agents.",
                color: "var(--accent)",
              },
              {
                t: "Cloud & DevOps",
                d: "AWS, Docker, Kubernetes, CI/CD pipelines.",
                color: "var(--primary)",
              },
              {
                t: "Performance",
                d: "Query optimization, async processing, low-latency APIs.",
                color: "var(--accent)",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="group rounded-2xl p-5 bg-card/90 shadow-soft hover:shadow-warm hover:-translate-y-1 transition-all border border-border/60"
              >
                <div
                  className="h-2 w-12 rounded-full mb-4 transition-all group-hover:w-16"
                  style={{ background: c.color }}
                />
                <div className="font-display text-xl">{c.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
