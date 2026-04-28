const certs = [
  "Machine Learning — IIT Kanpur (Workshop)",
  "DBMS — NPTEL",
  "System Design Cohort",
  "Generative AI — Udemy",
];

export function Education() {
  return (
    <section className="py-24 sm:py-32 max-w-6xl mx-auto px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-3xl p-10 bg-gradient-warm border border-border shadow-soft">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--cinnamon)]">
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

        <div className="rounded-3xl p-10 bg-card border border-border shadow-soft">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--cinnamon)]">
            ※ Certifications
          </span>
          <h3 className="mt-4 font-display text-3xl tracking-tight">
            Always learning.
          </h3>
          <ul className="mt-6 space-y-3">
            {certs.map((c, i) => (
              <li key={c} className="flex items-start gap-3 group">
                <span className="mt-1 font-mono text-xs text-muted-foreground">
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
