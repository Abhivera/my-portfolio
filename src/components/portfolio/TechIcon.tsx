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
  siGraphql,
  siReact,
  siDocker,
  siKubernetes,
  siGithubactions,
  siPrometheus,
  siGrafana,
  siTypescript,
  siGo,
  siGooglecloud,
  siGithub,
  siGmail,
  type SimpleIcon,
} from "simple-icons";

// Map a tech name -> simple-icon. Names without a direct brand match
// (gRPC, Webhooks, RAG, MCP, AWS, DynamoDB, etc.) fall back to an initial badge.
const map: Record<string, SimpleIcon | undefined> = {
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
  Claude: siAnthropic,
  GraphQL: siGraphql,
  React: siReact,
  Docker: siDocker,
  Kubernetes: siKubernetes,
  "CI/CD": siGithubactions,
  "GitHub Actions": siGithubactions,
  GitHub: siGithub,
  Prometheus: siPrometheus,
  Grafana: siGrafana,
  TypeScript: siTypescript,
  Go: siGo,
  GCP: siGooglecloud,
  Gmail: siGmail,
  Email: siGmail,
};

interface TechIconProps {
  name: string;
  size?: number;
  className?: string;
  /** Use the brand color instead of currentColor */
  brandColor?: boolean;
}

export function TechIcon({ name, size = 16, className, brandColor = false }: TechIconProps) {
  const icon = map[name];

  if (!icon) {
    // Fallback: rounded badge with the first letter
    return (
      <span
        className={`inline-flex items-center justify-center rounded font-mono font-bold ${className ?? ""}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(8, size * 0.55),
          background: "color-mix(in oklab, var(--chocolate) 12%, transparent)",
          color: "var(--chocolate)",
        }}
        aria-hidden
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={brandColor ? `#${icon.hex}` : "currentColor"}
      aria-label={icon.title}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}

export const hasTechIcon = (name: string) => Boolean(map[name]);
