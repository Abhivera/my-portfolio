import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDate, type BlogPost } from "@/lib/blog-data";
import { fetchPublishedPosts } from "@/lib/blog-client";

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetchPublishedPosts()
      .then((all) => setPosts(all.slice(0, 3)))
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section id="blog" className="py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12 sm:mb-16">
          <div>
            <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--aqua-400)]/30 bg-[color:var(--aqua-50)]/70 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--aqua-700)]">
              ✍ Writing
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">
              From the Blog.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Thoughts on backend engineering, AI systems, and the lessons from
              shipping real products.
            </p>
          </div>
          <Link
            to="/blog"
            className="text-sm font-medium text-foreground/70 hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            All posts <span aria-hidden>↗</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className={`group relative rounded-3xl p-6 bg-card border border-border shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col ${
                i === 0 ? "md:col-span-2" : ""
              }`}
            >
              <div className="absolute -top-14 -right-14 h-36 w-36 rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity pointer-events-none bg-[color:var(--aqua-400)]" />

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

                <h3 className="font-display text-xl sm:text-2xl tracking-tight leading-snug group-hover:text-[color:var(--aqua-700)] transition-colors">
                  {post.title}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                  {post.excerpt}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span>·</span>
                    <span>{post.readTime} min read</span>
                  </div>
                  <span className="text-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all text-lg">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
