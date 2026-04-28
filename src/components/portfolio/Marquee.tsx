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
  "Microservices",
];

export function Marquee() {
  const doubled = [...items, ...items];
  return (
    <div
      className="border-y border-border py-6 overflow-hidden"
      style={{ background: "var(--gradient-warm)" }}
    >
      <div className="flex gap-12 marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-6 font-display text-2xl text-foreground/70">
            <TechIcon name={item} size={28} className="text-foreground/60" />
            <span>{item}</span>
            <span className="text-[color:var(--sunset-orange)] ml-6">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

