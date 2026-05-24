import { createFileRoute, Link } from "@tanstack/react-router";
import { blogPosts, formatDate } from "@/lib/blog-data";
import { Nav } from "@/components/portfolio/Nav";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "Blog | Abhijit Verma" },
      {
        name: "description",
        content:
          "Thoughts on backend engineering, AI systems, RAG pipelines, Kafka, FastAPI and lessons from shipping real products.",
      },
      { name: "keywords", content: "Abhijit Verma blog, AI, RAG, Kafka, FastAPI, backend engineering" },
      { property: "og:title", content: "Blog | Abhijit Verma" },
      {
        property: "og:description",
        content: "Thoughts on backend engineering, AI systems, and shipping real products.",
      },
    ],
  }),
});

function BlogIndex() {
  const [featured, ...rest] = blogPosts;

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            ← Back home
          </Link>
          <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
            ✍ Writing
          </span>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight">
            The Blog.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Deep-dives on backend engineering, AI systems, and the lessons from
            building and shipping real products.
          </p>
        </div>
      </section>

      {/* Featured post */}
      {featured && (
        <section className="pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Featured
            </p>
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="group relative block rounded-3xl p-8 sm:p-10 bg-card border border-border shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity pointer-events-none bg-[color:var(--aqua-400)]" />
              <div className="relative">
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary/60 text-foreground/60 border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl tracking-tight leading-snug group-hover:text-[color:var(--aqua-700)] transition-colors max-w-3xl">
                  {featured.title}
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                  {featured.excerpt}
                </p>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <time dateTime={featured.date}>
                      {formatDate(featured.date)}
                    </time>
                    <span>·</span>
                    <span>{featured.readTime} min read</span>
                  </div>
                  <span className="text-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all text-xl">
                    →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* All posts grid */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {rest.length > 0 && (
            <>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
                All Posts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="group relative rounded-3xl p-6 bg-card border border-border shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-15 blur-2xl group-hover:opacity-30 transition-opacity pointer-events-none bg-[color:var(--aqua-400)]" />
                    <div className="relative flex flex-col flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary/60 text-foreground/60 border border-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-display text-xl tracking-tight leading-snug group-hover:text-[color:var(--aqua-700)] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                        {post.excerpt}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <time dateTime={post.date}>
                            {formatDate(post.date)}
                          </time>
                          <span>·</span>
                          <span>{post.readTime} min read</span>
                        </div>
                        <span className="text-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Coming soon banner */}
          <div className="mt-10 rounded-3xl p-8 sm:p-10 border-2 border-dashed border-border text-center">
            <p className="font-display text-2xl tracking-tight">
              More posts coming soon.
            </p>
            <p className="mt-2 text-muted-foreground">
              Writing about AI, backend systems, and the craft of engineering.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
