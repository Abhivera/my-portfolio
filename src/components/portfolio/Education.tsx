const certs = [
  "Machine Learning — IIT Kanpur (Workshop)",
  "DBMS — NPTEL",
  "System Design Cohort",
  "Generative AI — Udemy",
];

export function Education() {
  return (
    <section className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-warm border border-border shadow-soft hover:shadow-warm transition-shadow">
          <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
            ※ Education
          </span>
          <h3 className="mt-4 font-display text-3xl tracking-tight">
            B.Tech, Computer Science
          </h3>
          <p className="mt-2 text-foreground/80">AKTU (Dr. A.P.J. Abdul Kalam Technical University)</p>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-6xl text-gradient-sunset">8.2</span>
            <span className="text-muted-foreground">CGPA</span>
          </div>
        </div>

        <div className="rounded-3xl p-6 sm:p-10 bg-card border border-border shadow-soft hover:shadow-warm transition-shadow">
          <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
            ※ Certifications
          </span>
          <h3 className="mt-4 font-display text-3xl tracking-tight">
            Always learning.
          </h3>
          <ul className="mt-6 space-y-3">
            {certs.map((c, i) => (
              <li key={c} className="flex items-start gap-3 group rounded-xl px-3 py-2 -mx-3 hover:bg-secondary/60 transition-colors">
                <span className="mt-1 font-mono text-xs text-muted-foreground group-hover:text-foreground">
                  0{i + 1}
                </span>
                <span className="text-foreground/85 group-hover:text-foreground transition-colors">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
