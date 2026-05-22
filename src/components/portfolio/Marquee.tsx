import { TechIcon } from "./TechIcon";

const items = [
  "Node.js",
  "AI Agents",
  "Message Queues",
  "PostgreSQL",
  "AWS",
  "Python",
  "FastAPI",
  "Redis",
  "Docker",
  "LangChain",
  "RAG",
  "GraphQL",
  "gRPC",
  "Next.js",
  "Vercel",
  "Microservices",
  "OpenAI",
  "Anthropic",
  "Claude Code",
  "Cursor",
];

export function Marquee() {
  const doubled = [...items, ...items];
  return (
    <div
      className="relative z-10 border-y border-border py-5 sm:py-6 overflow-hidden shadow-soft"
      style={{ background: "var(--gradient-warm)" }}
    >
      <div className="flex gap-8 sm:gap-12 marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-4 sm:gap-6 font-display text-lg sm:text-2xl text-foreground/70">
            <TechIcon name={item} size={22} />
            <span>{item}</span>
            <span className="text-[color:var(--accent)] ml-4 sm:ml-6">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

