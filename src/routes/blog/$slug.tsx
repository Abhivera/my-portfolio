import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getBlogPost, blogPosts, formatDate } from "@/lib/blog-data";
import { Nav } from "@/components/portfolio/Nav";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getBlogPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  component: BlogPost,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Post"} | Abhijit Verma` },
      {
        name: "description",
        content: loaderData?.excerpt ?? "",
      },
      { property: "og:title", content: `${loaderData?.title} | Abhijit Verma` },
      { property: "og:description", content: loaderData?.excerpt ?? "" },
      { property: "og:type", content: "article" },
      {
        property: "article:published_time",
        content: loaderData?.date ?? "",
      },
    ],
  }),
});

function BlogPost() {
  const post = Route.useLoaderData();

  // Other posts for the "more reading" section
  const morePosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Article header */}
      <article>
        <header className="pt-32 pb-10 sm:pt-40 sm:pb-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              ← All posts
            </Link>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-secondary/60 text-foreground/60 border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight">
              {post.title}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>

            {/* Meta row */}
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-6">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-gradient-sunset flex items-center justify-center text-xs font-bold text-white">
                  A
                </span>
                <span className="font-medium text-foreground">Abhijit Verma</span>
              </div>
              <span>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>·</span>
              <span>{post.readTime} min read</span>
            </div>
          </div>
        </header>

        {/* Article body */}
        <div className="pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>

      {/* More posts */}
      {morePosts.length > 0 && (
        <section className="border-t border-border pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
              More Reading
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {morePosts.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group relative rounded-3xl p-6 bg-card border border-border shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-15 blur-2xl group-hover:opacity-30 transition-opacity pointer-events-none bg-[color:var(--aqua-400)]" />
                  <div className="relative flex flex-col flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary/60 text-foreground/60 border border-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-display text-xl tracking-tight leading-snug group-hover:text-[color:var(--aqua-700)] transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                      {p.excerpt}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <time dateTime={p.date}>{formatDate(p.date)}</time>
                        <span>·</span>
                        <span>{p.readTime} min read</span>
                      </div>
                      <span className="text-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
