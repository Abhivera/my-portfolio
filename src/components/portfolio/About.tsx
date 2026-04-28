export function About() {
  return (
    <section id="about" className="py-24 sm:py-32 max-w-6xl mx-auto px-6 lg:px-8">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="sticky top-28">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">
              ※ About
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
              Engineer with
              <br />
              <em className="text-gradient-sunset not-italic">a builder's mindset.</em>
            </h2>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6 text-lg leading-relaxed text-foreground/85">
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
                className="rounded-2xl p-5 bg-card shadow-soft hover:shadow-warm hover:-translate-y-1 transition-all border border-border/60"
              >
                <div
                  className="h-2 w-12 rounded-full mb-4"
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
