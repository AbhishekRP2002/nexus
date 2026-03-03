/**
 * Seed script — populates Qdrant with test content items for development.
 * Run: bun run seed (from nexus-platform-worker/)
 */
import { randomUUID } from "crypto";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", ".env") });

import { QdrantStore } from "../src/shared/vectorstore/qdrant.store.js";
import { createEmbeddings } from "../src/shared/providers/embeddings.js";
import type { VectorPayload } from "../src/shared/vectorstore/types.js";

const TEST_USER_ID = "test-user";

const seedContent: { text: string; payload: Omit<VectorPayload, "userId"> }[] =
  [
    {
      text: "Speculative decoding reduces inference latency by using a smaller draft model to generate candidate tokens, which the larger target model then verifies in parallel. This allows the target model to process multiple tokens per forward pass instead of one, achieving 2-3x speedup without any quality loss.",
      payload: {
        title: "Speculative Decoding: How Draft Models Speed Up LLM Inference",
        sourceType: "web",
        sourceUrl: "https://example.com/speculative-decoding",
        synopsis:
          "Speculative decoding uses a small draft model to propose tokens verified by a larger model in parallel, achieving 2-3x inference speedup.",
        keyInsights: [
          "Draft model generates candidate tokens speculatively",
          "Target model verifies all candidates in a single forward pass",
          "No quality degradation — mathematically equivalent output",
          "2-3x latency reduction on autoregressive generation",
        ],
        savedAt: "2025-12-15T10:00:00Z",
      },
    },
    {
      text: "RAG (Retrieval-Augmented Generation) improves LLM accuracy by grounding responses in retrieved documents. The key components are: embedding-based retrieval to find relevant context, a reranking step to filter noise, and a generation step where the LLM synthesizes an answer from the retrieved passages. Hybrid search combining BM25 lexical matching with dense vector similarity typically outperforms either approach alone.",
      payload: {
        title: "RAG Architecture: Building Accurate AI Search Systems",
        sourceType: "web",
        sourceUrl: "https://example.com/rag-architecture",
        synopsis:
          "RAG grounds LLM responses in retrieved documents using embedding search, reranking, and synthesis to improve accuracy.",
        keyInsights: [
          "Hybrid search (BM25 + dense vectors) outperforms single-method retrieval",
          "Reranking step filters irrelevant context before generation",
          "Chunking strategy significantly impacts retrieval quality",
          "Citation tracking enables verifiable AI answers",
        ],
        savedAt: "2025-11-20T14:30:00Z",
      },
    },
    {
      text: "Vector databases like Qdrant, Pinecone, and Weaviate store high-dimensional embeddings and support approximate nearest neighbor (ANN) search. Key considerations when choosing a vector DB: HNSW vs IVF index types, filtering capabilities, scalability, and whether you need hybrid search (vector + keyword). Qdrant stands out for its payload filtering and full-text search support alongside vector similarity.",
      payload: {
        title: "Vector Database Comparison: Qdrant vs Pinecone vs Weaviate",
        sourceType: "twitter",
        sourceUrl: "https://x.com/example/status/123456",
        synopsis:
          "Comparison of vector databases focusing on index types, filtering, scalability, and hybrid search capabilities.",
        keyInsights: [
          "HNSW indexes offer better recall than IVF for most use cases",
          "Payload filtering is critical for multi-tenant applications",
          "Qdrant supports full-text search alongside vector similarity",
          "Managed cloud offerings reduce operational complexity",
        ],
        savedAt: "2025-10-05T09:15:00Z",
      },
    },
    {
      text: "The attention mechanism in Transformers computes Q*K^T/sqrt(d) to generate attention scores, then applies softmax and multiplies by V. Multi-head attention splits the computation across multiple heads, each learning different relationship patterns. Flash Attention optimizes this by tiling the computation to fit in SRAM, reducing memory bandwidth bottlenecks and achieving 2-4x speedup on long sequences.",
      payload: {
        title: "Understanding Attention: From Vanilla to Flash Attention",
        sourceType: "web",
        sourceUrl: "https://example.com/attention-mechanisms",
        synopsis:
          "Deep dive into attention mechanisms from basic QKV computation to Flash Attention's memory-efficient optimization.",
        keyInsights: [
          "Attention is O(n^2) in sequence length — major bottleneck for long contexts",
          "Multi-head attention learns diverse relationship patterns",
          "Flash Attention tiles computation to stay in GPU SRAM",
          "2-4x speedup on long sequences with Flash Attention",
        ],
        savedAt: "2025-09-12T16:00:00Z",
      },
    },
    {
      text: "System design interviews require understanding of load balancing, database sharding, caching strategies, and message queues. Key patterns include: consistent hashing for distributed caching, CQRS for read-heavy systems, event sourcing for audit trails, and the saga pattern for distributed transactions. Always start with requirements clarification and back-of-envelope calculations before diving into architecture.",
      payload: {
        title: "System Design Interview Patterns and Best Practices",
        sourceType: "linkedin",
        sourceUrl: "https://linkedin.com/posts/example-123",
        synopsis:
          "Essential system design patterns for interviews covering load balancing, sharding, caching, and distributed transactions.",
        keyInsights: [
          "Start with requirements and capacity estimation",
          "Consistent hashing enables scalable distributed caching",
          "CQRS separates read and write models for optimization",
          "Saga pattern handles distributed transactions without 2PC",
        ],
        savedAt: "2025-08-22T11:45:00Z",
      },
    },
    {
      text: "Fine-tuning LLMs requires careful dataset preparation. Key techniques include: LoRA (Low-Rank Adaptation) which adds trainable rank decomposition matrices to existing weights, QLoRA for memory-efficient training with 4-bit quantization, and RLHF for aligning models with human preferences. LoRA reduces trainable parameters by 10-100x while maintaining quality comparable to full fine-tuning.",
      payload: {
        title: "Practical LLM Fine-Tuning: LoRA, QLoRA, and RLHF",
        sourceType: "web",
        sourceUrl: "https://example.com/llm-finetuning",
        synopsis:
          "Guide to LLM fine-tuning techniques including LoRA for parameter-efficient training and RLHF for alignment.",
        keyInsights: [
          "LoRA reduces trainable params by 10-100x with minimal quality loss",
          "QLoRA enables fine-tuning on consumer GPUs via 4-bit quantization",
          "RLHF aligns models with human preferences through reward modeling",
          "Dataset quality matters more than quantity for fine-tuning",
        ],
        savedAt: "2025-07-18T13:20:00Z",
      },
    },
    {
      text: "Kubernetes autoscaling has three dimensions: Horizontal Pod Autoscaler (HPA) adjusts pod replicas based on CPU/memory or custom metrics, Vertical Pod Autoscaler (VPA) adjusts resource requests and limits, and Cluster Autoscaler provisions or decommissions nodes. KEDA extends HPA with event-driven scaling based on external metrics like queue depth.",
      payload: {
        title: "Kubernetes Autoscaling: HPA, VPA, Cluster Autoscaler, and KEDA",
        sourceType: "web",
        sourceUrl: "https://example.com/k8s-autoscaling",
        synopsis:
          "Overview of Kubernetes autoscaling strategies from pod-level to cluster-level with KEDA for event-driven scaling.",
        keyInsights: [
          "HPA scales pods horizontally based on metrics",
          "VPA adjusts resource requests — don't use with HPA on same metric",
          "Cluster Autoscaler manages node pool sizing",
          "KEDA enables scaling from zero based on external event sources",
        ],
        savedAt: "2025-06-30T08:00:00Z",
      },
    },
    {
      text: "Prompt engineering patterns for production: Chain-of-Thought (CoT) prompting improves reasoning by asking the model to show its work. Few-shot prompting provides examples of desired output format. System prompts establish persistent behavior constraints. For structured output, instruct the model to respond in JSON and validate with a schema. Temperature 0 for deterministic tasks, 0.7+ for creative ones.",
      payload: {
        title: "Production Prompt Engineering: Patterns That Actually Work",
        sourceType: "twitter",
        sourceUrl: "https://x.com/example/status/789012",
        synopsis:
          "Battle-tested prompt engineering patterns for production AI applications including CoT, few-shot, and structured output.",
        keyInsights: [
          "Chain-of-Thought improves reasoning accuracy by 20-40%",
          "Few-shot examples anchor output format more reliably than instructions",
          "JSON mode + schema validation for reliable structured output",
          "Temperature 0 for factual tasks, higher for creative generation",
        ],
        savedAt: "2025-05-10T17:30:00Z",
      },
    },
  ];

async function seed() {
  console.log("Initializing Qdrant store...");
  const store = new QdrantStore();
  await store.initialize();

  console.log("Creating embeddings for %d items...", seedContent.length);
  const embeddings = createEmbeddings();

  const texts = seedContent.map((item) => item.text);
  const vectors = await embeddings.embedDocuments(texts);

  console.log("Upserting vectors into Qdrant...");
  const items = seedContent.map((item, i) => ({
    id: randomUUID(),
    vector: vectors[i],
    payload: {
      ...item.payload,
      userId: TEST_USER_ID,
      bodyText: item.text,
    },
  }));

  await store.batchUpsert(items);

  console.log("Seeded %d items for userId=%s", items.length, TEST_USER_ID);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
