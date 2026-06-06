import {
  siPython,
  siNodedotjs,
  siFastapi,
  siExpress,
  siApachekafka,
  siPostgresql,
  siRedis,
  siMongodb,
  siLangchain,
  siHuggingface,
  siAnthropic,
  siClaude,
  siCursor,
  siGraphql,
  siReact,
  siNextdotjs,
  siVercel,
  siDocker,
  siKubernetes,
  siGithubactions,
  siPrometheus,
  siGrafana,
  siTypescript,
  siGo,
  siGooglecloud,
  siGithub,
  siGitlab,
  siBitbucket,
  siGit,
  siElectron,
  siGmail,
  type SimpleIcon,
} from "simple-icons";

import {
  Bot,
  Network,
  Webhook,
  Layers,
  BrainCircuit,
  Share2,
  Workflow,
  Database,
  Globe,
  Zap,
  Code2,
  MessageSquare,
  Boxes,
  PlugZap,
  Radio,
  Package,
  type LucideIcon,
} from "lucide-react";

// ─── Brand icons (simple-icons) ──────────────────────────────────────────────
const brandMap: Record<string, SimpleIcon | undefined> = {
  Python: siPython,
  "Node.js": siNodedotjs,
  FastAPI: siFastapi,
  Express: siExpress,
  "Apache Kafka": siApachekafka,
  Kafka: siApachekafka,
  PostgreSQL: siPostgresql,
  pgvector: siPostgresql,
  Redis: siRedis,
  MongoDB: siMongodb,
  LangChain: siLangchain,
  HuggingFace: siHuggingface,
  Anthropic: siAnthropic,
  Claude: siClaude,
  "Claude Code": siClaude,
  Cursor: siCursor,
  GraphQL: siGraphql,
  React: siReact,
  "Next.js": siNextdotjs,
  Vercel: siVercel,
  Docker: siDocker,
  Kubernetes: siKubernetes,
  "CI/CD": siGithubactions,
  "GitHub Actions": siGithubactions,
  GitHub: siGithub,
  GitLab: siGitlab,
  Bitbucket: siBitbucket,
  Git: siGit,
  Electron: siElectron,
  Prometheus: siPrometheus,
  Grafana: siGrafana,
  TypeScript: siTypescript,
  Go: siGo,
  GCP: siGooglecloud,
  Gmail: siGmail,
  Email: siGmail,
};

// Brand hex values that are too dark to render on dark backgrounds
const darkHex = new Set(["000000", "191919", "1a1a1a"]);

// ─── Concept icons (lucide-react) ─────────────────────────────────────────────
// Used for things without a brand logo — colors are explicit accent tones.
const lucideMap: Record<string, { icon: LucideIcon; color: string } | undefined> = {
  "AI Agents":       { icon: Bot,          color: "#a78bfa" }, // violet
  "Message Queues":  { icon: MessageSquare, color: "#60a5fa" }, // blue
  RAG:               { icon: BrainCircuit,  color: "#34d399" }, // emerald
  gRPC:              { icon: Network,        color: "#4285F4" }, // google blue
  Microservices:     { icon: Boxes,          color: "#f472b6" }, // pink
  Webhooks:          { icon: Webhook,        color: "#fb923c" }, // orange
  REST:              { icon: Globe,          color: "#38bdf8" }, // sky
  "Event-Driven":    { icon: Zap,           color: "#fbbf24" }, // amber
  "Pub/Sub":         { icon: Radio,          color: "#4285F4" },
  PubSub:            { icon: Radio,          color: "#4285F4" },
  MCP:               { icon: PlugZap,        color: "#a78bfa" },
  LLM:               { icon: BrainCircuit,  color: "#34d399" },
  "Vector Search":   { icon: Share2,         color: "#34d399" },
  "Vector DB":       { icon: Database,       color: "#34d399" },
  "AI Agents (MCP)": { icon: Bot,           color: "#a78bfa" },
  Tools:             { icon: Code2,          color: "#94a3b8" },
  "AWS SQS":         { icon: MessageSquare, color: "#FF9900" },
  DynamoDB:          { icon: Database,       color: "#4053D6" },
  "Vector Search DB":{ icon: Share2,         color: "#34d399" },
  Workflows:         { icon: Workflow,        color: "#f472b6" },
  Layers:            { icon: Layers,          color: "#94a3b8" },
  Package:           { icon: Package,         color: "#94a3b8" },
};

interface TechIconProps {
  name: string;
  size?: number;
  className?: string;
  /** Use the original brand color instead of currentColor (only affects simple-icons) */
  brandColor?: boolean;
}

export function TechIcon({ name, size = 16, className, brandColor = true }: TechIconProps) {
  // ── 1. Special case: AWS family (custom inline SVG) ──────────────────────
  if (name === "AWS" || name === "AWS SQS") {
    const isJustSqs = name === "AWS SQS";
    return (
      <svg
        role="img"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={className}
        aria-label={name}
      >
        <title>{name}</title>
        <text
          x="3.5"
          y={isJustSqs ? "11" : "14.5"}
          fontSize="9.5"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
          fill="currentColor"
        >
          aws
        </text>
        {isJustSqs && (
          <text x="3" y="22" fontSize="7.5" fontWeight="600" fontFamily="Inter, system-ui, sans-serif" fill="#FF9900">
            SQS
          </text>
        )}
        <path
          d="M6 20.5c4 3 11.5 3.2 17.5 0.6"
          fill="none"
          stroke="#FF9900"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M22.8 19.5l2.8.9-1.8 2.3z" fill="#FF9900" />
      </svg>
    );
  }

  // ── 2. Special case: OpenAI (custom SVG — not in simple-icons) ───────────
  if (name === "OpenAI") {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        fill="currentColor"
        aria-label="OpenAI"
      >
        <title>OpenAI</title>
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    );
  }

  // ── 3. Brand icon (simple-icons) ──────────────────────────────────────────
  const brandIcon = brandMap[name];
  if (brandIcon) {
    const fillColor =
      brandColor && !darkHex.has(brandIcon.hex)
        ? `#${brandIcon.hex}`
        : "currentColor";
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        fill={fillColor}
        aria-label={brandIcon.title}
      >
        <title>{brandIcon.title}</title>
        <path d={brandIcon.path} />
      </svg>
    );
  }

  // ── 4. Concept icon (lucide-react) ────────────────────────────────────────
  const lucideEntry = lucideMap[name];
  if (lucideEntry) {
    const { icon: Icon, color } = lucideEntry;
    return (
      <Icon
        width={size}
        height={size}
        className={className}
        style={{ color: brandColor ? color : "currentColor" }}
        aria-label={name}
      />
    );
  }

  // ── 5. Final fallback: letter badge ───────────────────────────────────────
  const fallbackColor = "var(--primary)";
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-mono font-bold ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size * 0.55),
        background: `color-mix(in oklab, ${fallbackColor} 16%, transparent)`,
        color: fallbackColor,
      }}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  );
}
