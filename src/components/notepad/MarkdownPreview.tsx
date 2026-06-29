import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground/60">
        Nothing to preview yet. Switch to Edit and start writing some markdown.
      </p>
    );
  }

  return (
    <div className={cn("text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 mb-4 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-3 border-b pb-1.5 text-xl font-semibold tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 text-lg font-semibold tracking-tight first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-base font-semibold tracking-tight first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="my-3 leading-7">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-3 ml-6 list-disc space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-6 list-decimal space-y-1.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-border pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          code: ({ className: codeClassName, children }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className={cn("font-mono text-[13px]", codeClassName)}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-[13px] leading-relaxed">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b">{children}</thead>,
          th: ({ children }) => (
            <th className="border px-3 py-1.5 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border px-3 py-1.5">{children}</td>
          ),
          img: ({ src, alt }) => (
            <img
              src={typeof src === "string" ? src : undefined}
              alt={alt}
              className="my-4 max-w-full rounded-lg border"
            />
          ),
          input: ({ checked, type }) =>
            type === "checkbox" ? (
              <input
                type="checkbox"
                checked={checked}
                readOnly
                className="mr-2 align-middle accent-primary"
              />
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
