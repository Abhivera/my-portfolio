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
  siGitlab,
  siBitbucket,
  siGit,
  siElectron,
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

const fallbackBrandColors: Record<string, string | undefined> = {
  AWS: "#FF9900",
  "AWS SQS": "#FF9900",
  DynamoDB: "#4053D6",
  "Vector DB": "#71C9CE",
  RAG: "#71C9CE",
  MCP: "#71C9CE",
  LLM: "#71C9CE",
  Tools: "#71C9CE",
  Webhooks: "#71C9CE",
  REST: "#71C9CE",
  gRPC: "#4285F4",
  PubSub: "#4285F4",
  "Pub/Sub": "#4285F4",
  Microservices: "#71C9CE",
  "Event-Driven": "#71C9CE",
};

interface TechIconProps {
  name: string;
  size?: number;
  className?: string;
  /** Use the original brand color instead of currentColor */
  brandColor?: boolean;
}

export function TechIcon({ name, size = 16, className, brandColor = true }: TechIconProps) {
  const icon = map[name];
  const fallbackColor = fallbackBrandColors[name] ?? "var(--primary)";
  const isAwsFamily = name === "AWS" || name === "AWS SQS";

  if (isAwsFamily) {
    return (
      <svg
        role="img"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={className}
        aria-label="Amazon Web Services"
      >
        <title>Amazon Web Services</title>
        <text
          x="3.5"
          y="14.5"
          fontSize="9.5"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
          fill="#111111"
        >
          aws
        </text>
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

  if (!icon) {
    // Fallback: rounded badge with the first letter
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
