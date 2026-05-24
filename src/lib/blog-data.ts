export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date string
  readTime: number; // minutes
  tags: string[];
  content: string; // Markdown-ish HTML string
  featured?: boolean;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "building-rag-pipelines-production",
    title: "Building RAG Pipelines for Production: Lessons Learned",
    excerpt:
      "After shipping multiple Retrieval-Augmented Generation systems to production, here's what actually matters — chunking strategies, embedding model selection, and the retrieval pitfalls nobody talks about.",
    date: "2026-05-15",
    readTime: 8,
    tags: ["AI", "RAG", "LLM", "Python", "FastAPI"],
    featured: true,
    content: `
<h2>Why RAG in Production Is Hard</h2>
<p>Retrieval-Augmented Generation sounds straightforward on paper: embed your documents, store them in a vector database, retrieve the top-k chunks at query time, and pass them to an LLM. In practice, each of those steps has sharp edges that only reveal themselves under real load with real user queries.</p>

<h2>Chunking Strategy Is Everything</h2>
<p>The single biggest lever you have over retrieval quality is how you split your documents. Fixed-size chunks (e.g. 512 tokens) are easy to implement but brutal for structured content like documentation or contracts where a concept spans multiple paragraphs.</p>
<p>What actually worked for us: <strong>semantic chunking</strong> — split on heading boundaries first, then sub-split oversized sections with overlap. This keeps logical units together so the LLM gets coherent context.</p>
<pre><code class="language-python">def semantic_chunk(text: str, max_tokens: int = 400, overlap: int = 50) -> list[str]:
    # Split on h2/h3 boundaries first
    sections = re.split(r'\\n(?=## |### )', text)
    chunks = []
    for section in sections:
        tokens = tokenize(section)
        if len(tokens) <= max_tokens:
            chunks.append(section)
        else:
            # sliding window sub-split
            for i in range(0, len(tokens), max_tokens - overlap):
                chunks.append(detokenize(tokens[i : i + max_tokens]))
    return chunks</code></pre>

<h2>Embedding Model Selection</h2>
<p>Not all embedding models are equal, and the gap is enormous for domain-specific content. For technical documentation, <code>text-embedding-3-large</code> consistently outperforms the small variant by ~15% on our internal retrieval benchmarks, worth the extra cost.</p>
<p>If you're cost-sensitive: <strong>embed at write time, cache aggressively</strong>. Most queries hit the same handful of chunks — caching at the retrieval layer (Redis with a short TTL) can cut embedding API costs by 60%.</p>

<h2>The Reranking Layer You're Probably Skipping</h2>
<p>Vector similarity gives you candidates. A cross-encoder reranker (Cohere Rerank, BGE-Reranker, or a fine-tuned model) picks the winners. Adding a reranker after initial retrieval improved our answer quality measurably — it's one of the highest-ROI changes you can make to an existing RAG system.</p>

<h2>Evaluation Is Non-Negotiable</h2>
<p>Ship a small golden eval set before you go to prod. We use RAGAS (faithfulness + answer relevancy) plus a few hand-crafted adversarial queries. CI blocks deployment if scores regress. Without this, you're flying blind every time you swap a model or tweak your prompts.</p>

<h2>Key Takeaways</h2>
<ul>
  <li>Invest in chunking first — it's cheaper to fix than the model layer</li>
  <li>Profile which queries miss before optimising</li>
  <li>Add a reranker as soon as retrieval quality matters</li>
  <li>Automate eval or your RAG will quietly regress</li>
</ul>
    `.trim(),
  },
  {
    slug: "event-driven-microservices-kafka",
    title: "Event-Driven Microservices with Kafka: A Practical Guide",
    excerpt:
      "Three years of running Kafka in production across multiple services. Here's the architecture that scales, the anti-patterns that bite, and the operational setup that keeps things sane.",
    date: "2026-04-28",
    readTime: 10,
    tags: ["Kafka", "Microservices", "Backend", "Architecture"],
    featured: true,
    content: `
<h2>Why Event-Driven?</h2>
<p>Synchronous REST calls between services work until they don't. When service B is slow, service A degrades. When service B goes down, service A fails. Event-driven architecture decouples producers from consumers — service A publishes an event and moves on; service B processes it in its own time.</p>

<h2>Topic Design Is Architecture</h2>
<p>The biggest mistake teams make: one massive topic per service. Topic design should reflect your domain boundaries. We use a naming convention of <code>&lt;domain&gt;.&lt;entity&gt;.&lt;event-type&gt;</code>, for example <code>nutrition.meal.logged</code> or <code>auth.user.created</code>.</p>
<p>This makes it trivially easy to set up per-consumer-group ACLs and reason about data lineage.</p>

<h2>Consumer Group Patterns</h2>
<p>Each independent consumer of an event stream should have its own consumer group. Never share consumer groups across services that do different things — you'll get unpredictable routing and debugging nightmares.</p>
<pre><code class="language-python">consumer = AIOKafkaConsumer(
    "nutrition.meal.logged",
    bootstrap_servers=settings.KAFKA_BROKERS,
    group_id="analytics-service",          # unique per consuming service
    auto_offset_reset="earliest",
    enable_auto_commit=False,              # always manual commit in prod
)

async def process_events():
    async for msg in consumer:
        try:
            await handle_meal_logged(msg.value)
            await consumer.commit()
        except Exception as e:
            # Dead-letter queue or retry topic
            await publish_to_dlq(msg, error=e)</code></pre>

<h2>Idempotency Is Mandatory</h2>
<p>Kafka gives you at-least-once delivery. Your consumers will see duplicates. Design your handlers to be idempotent — the simplest approach is a processed-event-id table with a unique constraint. On duplicate, skip and ack.</p>

<h2>Schema Registry from Day One</h2>
<p>Start with Avro or Protobuf schemas registered in Confluent Schema Registry (or a self-hosted equivalent). JSON events feel faster to iterate on early, but you'll spend weeks debugging schema drift across services eventually. The upfront cost of a registry is trivial versus the ops pain of untyped event streams.</p>

<h2>Monitoring Signals That Matter</h2>
<ul>
  <li><strong>Consumer lag</strong>: alert when lag spikes unexpectedly</li>
  <li><strong>Processing latency p99</strong>: SLO breaches before users notice</li>
  <li><strong>DLQ message rate</strong>: signals systematic handler failures</li>
  <li><strong>Broker under-replicated partitions</strong>: early warning of cluster instability</li>
</ul>
    `.trim(),
  },
  {
    slug: "fastapi-at-scale",
    title: "FastAPI at Scale: Patterns I Wish I Knew Earlier",
    excerpt:
      "FastAPI makes the happy path trivially easy. Here are the patterns that separate a weekend project from a production service — dependency injection, background tasks, structured logging, and more.",
    date: "2026-04-10",
    readTime: 7,
    tags: ["FastAPI", "Python", "Backend", "API"],
    content: `
<h2>Dependency Injection Is Your Architecture</h2>
<p>FastAPI's dependency injection system isn't a nice-to-have — it's where you put your architecture. Database sessions, auth context, feature flags, and service instances should all flow through <code>Depends()</code>. This makes testing trivial because you can override any dependency in tests.</p>
<pre><code class="language-python">async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

@router.post("/meals")
async def log_meal(
    payload: MealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MealResponse:
    ...</code></pre>

<h2>Structured Logging from the Start</h2>
<p>Replace print statements and unstructured logging with structured JSON logs from day one. We use <code>structlog</code> with a custom processor pipeline that adds request IDs, user IDs, and timing to every log line automatically via middleware.</p>

<h2>Background Tasks vs Celery</h2>
<p>FastAPI's built-in <code>BackgroundTasks</code> are great for fire-and-forget work that must complete within a single request lifecycle (e.g. sending a welcome email). For anything requiring retries, scheduling, or distributed execution, use Celery or a proper task queue. The line is: <em>if failure is acceptable, use BackgroundTasks; if not, use a queue</em>.</p>

<h2>Lifespan for Startup/Shutdown</h2>
<p>Use the <code>lifespan</code> context manager (not the deprecated <code>@app.on_event</code>) to manage connection pools, warm caches, and register signal handlers. It's cleaner and composes properly with nested context managers.</p>

<h2>Response Model Always</h2>
<p>Define <code>response_model</code> on every endpoint. It gives you free OpenAPI docs, automatic field filtering (so you never accidentally leak internal fields), and a forcing function to keep your API contract explicit.</p>
    `.trim(),
  },
  {
    slug: "ai-agents-tool-calling",
    title: "Practical AI Agents: Tool Calling That Actually Works",
    excerpt:
      "Building AI agents that reliably use tools is harder than the demos suggest. Here's what I learned shipping a voice customer-support agent with multi-step tool calls to production.",
    date: "2026-03-22",
    readTime: 9,
    tags: ["AI", "LLM", "Agents", "TypeScript", "Anthropic"],
    content: `
<h2>The Gap Between Demo and Production</h2>
<p>Every LLM provider has a shiny tool-calling demo. In production, you deal with: the model calling the wrong tool, calling it with invalid parameters, getting stuck in loops, or hallucinating results when a tool returns an empty response. Here's how we handled each of these in Streammeo.</p>

<h2>Tool Schemas Are Prompts</h2>
<p>Your tool JSON schema is part of your prompt. Vague descriptions lead to wrong tool selections. Invest time in clear, specific descriptions and examples. Include what the tool does NOT do — negative examples prevent a surprising number of mistakes.</p>
<pre><code class="language-typescript">const tools = [
  {
    name: "lookup_order_status",
    description: \`Look up the current status of a customer order by order ID.
Use this when the customer asks about WHERE their order is, WHEN it will arrive, 
or what the current STATUS of their order is.
Do NOT use this to cancel or modify orders — use update_order for that.\`,
    input_schema: {
      type: "object",
      properties: {
        order_id: { 
          type: "string", 
          description: "The order ID, typically in format ORD-XXXXXX"
        }
      },
      required: ["order_id"]
    }
  }
];</code></pre>

<h2>Validate Tool Inputs Before Calling</h2>
<p>Never pass the model's tool input directly to your function. Parse and validate it with Zod (TypeScript) or Pydantic (Python) first. Models occasionally produce structurally valid JSON that violates your business rules — validation catches these before they hit your database.</p>

<h2>Deterministic Fallbacks</h2>
<p>Every tool should have a graceful failure mode that the LLM can reason about. Return structured errors, not exceptions. Include a <code>success: boolean</code> and <code>message: string</code> in every tool response — the model needs enough signal to either retry, ask for clarification, or escalate.</p>

<h2>Loop Detection</h2>
<p>Cap the number of tool call rounds (we use 6) and detect when the model is calling the same tool with the same arguments repeatedly. On detection, break the loop and return a safe response to the user.</p>

<h2>Streaming + Tool Calls Together</h2>
<p>Streaming with tool calls requires careful buffering — you must accumulate the full tool call before executing it, then resume streaming the final response. This is non-obvious and the source of many subtle bugs in agent implementations.</p>
    `.trim(),
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((p) => p.featured).slice(0, 3);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
