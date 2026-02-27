import type {
  ContentItem,
  TaxonomyNode,
  KnowledgeBaseStats,
  ProcessingItem,
  Chapter,
} from "./types"

export const mockStats: KnowledgeBaseStats = {
  totalItems: 247,
  thisWeek: 18,
  categories: 14,
}

export const mockProcessing: ProcessingItem[] = [
  { id: "p1", title: "Graph Neural Net...", status: "DISTILLING" },
  { id: "p2", title: "Scaling Kuberne...", status: "EXTRACTING" },
]

export const mockTopCategories = [
  { label: "LLM Inference", count: 42, color: "bg-purple-400" },
  { label: "System Design", count: 38, color: "bg-blue-400" },
  { label: "RAG Systems", count: 31, color: "bg-emerald-400" },
  { label: "Vector Databases", count: 24, color: "bg-amber-400" },
  { label: "Agent Architectures", count: 19, color: "bg-rose-400" },
]

export const mockFeedItems: ContentItem[] = [
  {
    id: "1",
    sourceType: "twitter",
    sourceUrl: "https://twitter.com/inference_eng/status/1",
    title:
      "How we reduced LLM inference latency by 60% using speculative decoding with a draft model",
    author: "@inference_eng",
    authorHandle: "inference_eng",
    publishedAt: "2025-10-24",
    savedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "READY",
    category: "LLM Inference",
    categoryId: "cat-llm-inference",
    synopsis: {
      what: "Production implementation of speculative decoding that reduced p95 inference latency from 850ms to 340ms for a 70B parameter model.",
      why: "Autoregressive decoding is inherently serial and memory-bandwidth bound. Speculative decoding trades compute for latency by verifying multiple tokens in parallel.",
      how: "Uses a 7B draft model to propose 5 tokens at a time, verified by the 70B target model in a single forward pass. Custom KV cache management handles the verification-rejection cycle.",
    },
    keyInsights: [
      "Speculative decoding uses a smaller draft model to propose tokens that the main model verifies in parallel",
      "Acceptance rate of 70-85% achievable with a draft model 10x smaller than the target",
      "Key bottleneck is KV cache management during the verification step",
    ],
    entities: [
      { name: "Speculative Decoding", type: "tech" },
      { name: "KV Cache", type: "tech" },
      { name: "Inference Optimization", type: "concept" },
      { name: "Draft Models", type: "tech" },
    ],
    tags: ["Speculative Decoding", "KV Cache", "Inference Optimization", "Draft Models"],
    relatedContent: [
      {
        id: "3",
        title:
          "vLLM's PagedAttention: How OS-style virtual memory revolutionized KV cache management",
        sourceType: "web",
        similarity: 0.87,
      },
      {
        id: "5",
        title:
          "Thread: GPTQ vs AWQ vs GGUF — practical guide to quantization for production deployments",
        sourceType: "twitter",
        similarity: 0.72,
      },
    ],
    metadata: {
      Source: "twitter.com/inference_eng",
      Type: "Thread (12 tweets)",
      Saved: "Feb 24, 2026",
      Processed: "Feb 24, 2026",
      Status: "Ready",
    },
  },
  {
    id: "2",
    sourceType: "web",
    sourceUrl: "https://blog.example.com/feature-store",
    title: "Building a real-time feature store: Lessons from serving 10M+ predictions per second",
    author: "Engineering Blog",
    savedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: "READY",
    category: "System Design",
    categoryId: "cat-system-design",
    synopsis: {
      what: "Architecture patterns for low-latency feature serving using Redis as a hot cache layer with PostgreSQL as the source of truth for feature definitions.",
      why: "Feature stores should separate feature computation from feature serving for independent scaling.",
      how: "Redis with pipelining can serve features at p99 < 5ms for batch requests of 100+ features.",
    },
    keyInsights: [
      "Feature stores should separate feature computation from feature serving for independent scaling",
      "Redis with pipelining can serve features at p99 < 5ms for batch requests of 100+ features",
    ],
    entities: [
      { name: "Feature Store", type: "tech" },
      { name: "Redis", type: "tech" },
      { name: "Real-time ML", type: "concept" },
    ],
    tags: ["Feature Store", "Redis", "Real-time ML"],
  },
  {
    id: "3",
    sourceType: "web",
    sourceUrl: "https://blog.vllm.ai/paged-attention",
    title: "vLLM's PagedAttention: How OS-style virtual memory revolutionized KV cache management",
    author: "vLLM Team",
    savedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    status: "READY",
    category: "LLM Inference",
    categoryId: "cat-llm-inference",
    keyInsights: [
      "Paged KV cache eliminates memory fragmentation by 60-85%",
      "OS virtual memory concepts (paging, copy-on-write) apply directly to KV cache management",
    ],
    entities: [
      { name: "PagedAttention", type: "tech" },
      { name: "vLLM", type: "tech" },
    ],
    tags: ["PagedAttention", "vLLM", "KV Cache"],
  },
  {
    id: "4",
    sourceType: "twitter",
    sourceUrl: "https://twitter.com/rag_researcher/status/4",
    title:
      "Thread: Why hybrid search (BM25 + vector) consistently outperforms pure vector retrieval in production RAG",
    author: "@rag_researcher",
    savedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    status: "READY",
    category: "RAG Systems",
    categoryId: "cat-rag",
    keyInsights: [
      "Empirical comparison of retrieval strategies across different document collections showing that lexical matching catches keyword-specific queries that embeddings miss",
      "Reciprocal Rank Fusion (RRF) outperforms linear score combination for merging BM25 and vector results",
    ],
    entities: [
      { name: "Hybrid Search", type: "tech" },
      { name: "BM25", type: "tech" },
      { name: "RAG", type: "concept" },
    ],
    tags: ["Hybrid Search", "BM25", "RAG", "Vector Retrieval"],
  },
  {
    id: "5",
    sourceType: "twitter",
    sourceUrl: "https://twitter.com/quant_eng/status/5",
    title:
      "Thread: GPTQ vs AWQ vs GGUF — practical guide to quantization for production deployments",
    author: "@quant_eng",
    savedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: "READY",
    category: "LLM Inference",
    categoryId: "cat-llm-inference",
    keyInsights: [
      "AWQ preserves quality better at 4-bit for instruction-tuned models",
      "GGUF is optimal for CPU inference with llama.cpp, while GPTQ suits GPU deployments",
    ],
    entities: [
      { name: "GPTQ", type: "tech" },
      { name: "AWQ", type: "tech" },
      { name: "Quantization", type: "concept" },
    ],
    tags: ["GPTQ", "AWQ", "Quantization"],
  },
  {
    id: "6",
    sourceType: "web",
    sourceUrl: "https://blog.example.com/continuous-batching",
    title: "Continuous batching explained: Why naive batching wastes 70% of your GPU compute",
    author: "ML Infrastructure Blog",
    savedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    status: "READY",
    category: "LLM Inference",
    categoryId: "cat-llm-inference",
    keyInsights: [
      "Iteration-level scheduling allows new requests to join mid-batch",
      "Continuous batching can improve throughput by 3-5x compared to static batching",
    ],
    entities: [
      { name: "Continuous Batching", type: "tech" },
      { name: "GPU Scheduling", type: "concept" },
    ],
    tags: ["Continuous Batching", "GPU Compute", "Inference"],
  },
]

export const mockTaxonomy: TaxonomyNode[] = [
  {
    id: "cat-ml",
    label: "ML Systems",
    parentId: null,
    itemCount: 89,
    depth: 0,
    children: [
      {
        id: "cat-llm-inference",
        label: "LLM Inference",
        parentId: "cat-ml",
        itemCount: 42,
        depth: 1,
        isNew: true,
        children: [
          {
            id: "cat-kv-cache",
            label: "KV Cache Optimization",
            parentId: "cat-llm-inference",
            itemCount: 8,
            depth: 2,
            children: [],
          },
          {
            id: "cat-spec-decode",
            label: "Speculative Decoding",
            parentId: "cat-llm-inference",
            itemCount: 6,
            depth: 2,
            children: [],
          },
          {
            id: "cat-quantization",
            label: "Quantization",
            parentId: "cat-llm-inference",
            itemCount: 11,
            depth: 2,
            children: [],
          },
          {
            id: "cat-batching",
            label: "Batching Strategies",
            parentId: "cat-llm-inference",
            itemCount: 5,
            depth: 2,
            children: [],
          },
        ],
      },
      {
        id: "cat-training",
        label: "Training & Fine-tuning",
        parentId: "cat-ml",
        itemCount: 23,
        depth: 1,
        children: [],
      },
      {
        id: "cat-eval",
        label: "Evaluation & Benchmarks",
        parentId: "cat-ml",
        itemCount: 12,
        depth: 1,
        children: [],
      },
    ],
  },
  {
    id: "cat-rag",
    label: "RAG Systems",
    parentId: null,
    itemCount: 31,
    depth: 0,
    children: [],
  },
  {
    id: "cat-system-design",
    label: "System Design",
    parentId: null,
    itemCount: 38,
    depth: 0,
    children: [],
  },
  {
    id: "cat-agents",
    label: "Agent Architectures",
    parentId: null,
    itemCount: 19,
    depth: 0,
    children: [],
  },
  {
    id: "cat-vector-db",
    label: "Vector Databases",
    parentId: null,
    itemCount: 24,
    depth: 0,
    children: [],
  },
  {
    id: "cat-distributed",
    label: "Distributed Computing",
    parentId: null,
    itemCount: 15,
    depth: 0,
    children: [],
  },
  {
    id: "cat-papers",
    label: "Research Papers",
    parentId: null,
    itemCount: 11,
    depth: 0,
    children: [],
  },
]

export function getCategoryDescription(label: string): string {
  const descriptions: Record<string, string> = {
    "ML Systems": "Machine learning infrastructure, training, inference, and deployment systems.",
    "LLM Inference":
      "Techniques for optimizing large language model inference: speculative decoding, KV cache management, quantization, continuous batching, and serving infrastructure.",
    "KV Cache Optimization":
      "Memory management strategies for key-value caches in transformer inference.",
    "Speculative Decoding":
      "Using draft models to propose tokens verified by larger models for faster inference.",
    Quantization: "Model weight quantization techniques for efficient deployment.",
    "Batching Strategies": "Request batching approaches for maximizing GPU throughput.",
    "Training & Fine-tuning": "Techniques for training and fine-tuning language models.",
    "Evaluation & Benchmarks": "Model evaluation methodologies and benchmark analysis.",
    "RAG Systems": "Retrieval-augmented generation architectures and techniques.",
    "System Design": "Large-scale system architecture patterns and best practices.",
    "Agent Architectures": "AI agent design patterns, tool use, and orchestration frameworks.",
    "Vector Databases": "Vector storage, indexing, and similarity search systems.",
    "Distributed Computing": "Distributed systems, consensus protocols, and scaling patterns.",
    "Research Papers": "Academic papers and research findings.",
  }
  return descriptions[label] ?? ""
}

// ---------- Chapter / Living Book mock data ----------

export const mockChapters: Record<string, Chapter> = {
  // ── Parent chapter: ML Systems ──
  "cat-ml": {
    id: "chapter-ml",
    categoryId: "cat-ml",
    title: "ML Systems",
    description: "Machine learning infrastructure, training, inference, and deployment systems.",
    isParent: true,
    sections: [
      {
        id: "sec-ml-overview",
        type: "overview",
        title: "Overview",
        content: `<p>Machine learning systems encompass the full stack of infrastructure required to train, optimize, and serve ML models at scale. This knowledge area covers three major sub-domains: <strong>LLM inference optimization</strong> (the largest and fastest-evolving area), <strong>training and fine-tuning</strong> methodologies, and <strong>evaluation and benchmarking</strong> frameworks.</p><p>The common thread across all sub-topics is the tension between model capability and operational efficiency — larger models produce better results but demand increasingly sophisticated infrastructure to serve within latency and cost constraints.</p>`,
      },
      {
        id: "sec-ml-subchapters",
        type: "subchapters",
        title: "Sub-chapters",
        content: "",
      },
    ],
    sourceItemIds: ["1", "3", "5", "6"],
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Parent chapter: LLM Inference ──
  "cat-llm-inference": {
    id: "chapter-llm-inference",
    categoryId: "cat-llm-inference",
    title: "LLM Inference",
    description:
      "Techniques for optimizing large language model inference: speculative decoding, KV cache management, quantization, and continuous batching.",
    isParent: true,
    sections: [
      {
        id: "sec-llm-overview",
        type: "overview",
        title: "Overview",
        content: `<p>LLM inference optimization is fundamentally about overcoming the <strong>memory-bandwidth bottleneck</strong> inherent in autoregressive transformer decoding. Unlike training (which is compute-bound), inference is memory-bound — the GPU spends most of its time moving weights and KV cache entries rather than performing arithmetic.</p><p>Four key optimization strategies have emerged, each attacking a different aspect of the problem:</p><ul><li><strong>Speculative decoding</strong> — trades compute for latency by verifying multiple tokens in parallel</li><li><strong>KV cache optimization</strong> — applies OS-style memory management to reduce cache fragmentation</li><li><strong>Quantization</strong> — reduces model weight precision to fit larger models on fewer GPUs</li><li><strong>Continuous batching</strong> — maximizes GPU utilization through iteration-level scheduling</li></ul>`,
      },
      {
        id: "sec-llm-subchapters",
        type: "subchapters",
        title: "Sub-chapters",
        content: "",
      },
    ],
    sourceItemIds: ["1", "3", "5", "6"],
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Leaf chapter: KV Cache Optimization ──
  "cat-kv-cache": {
    id: "chapter-kv-cache",
    categoryId: "cat-kv-cache",
    title: "KV Cache Optimization",
    description: "Memory management strategies for key-value caches in transformer inference.",
    isParent: false,
    sections: [
      {
        id: "sec-kv-overview",
        type: "overview",
        title: "Overview",
        content: `<p>The KV (key-value) cache stores computed attention keys and values from previous tokens, avoiding redundant computation during autoregressive generation. However, naive KV cache allocation leads to severe <strong>memory fragmentation</strong> — up to 60-85% of GPU memory can be wasted on reserved but unused cache slots.</p><p>The breakthrough insight from vLLM's PagedAttention is that <strong>operating system memory management concepts</strong> (paging, virtual memory, copy-on-write) can be applied directly to KV cache management, dramatically improving memory utilization and enabling higher throughput.</p>`,
      },
      {
        id: "sec-kv-techniques",
        type: "techniques",
        title: "Key Techniques",
        content: `<h3>PagedAttention (vLLM)</h3><p>Instead of allocating a contiguous block of GPU memory for each sequence's KV cache, PagedAttention divides the cache into fixed-size <strong>pages</strong>. Pages are allocated on demand and can be non-contiguous in physical memory, just like OS virtual memory. This eliminates internal fragmentation.</p><h3>Copy-on-Write for Parallel Sampling</h3><p>When generating multiple candidates (beam search, parallel sampling), sequences that share a common prefix can share KV cache pages via copy-on-write. Pages are only duplicated when a sequence diverges, reducing memory usage proportionally to prefix sharing.</p><h3>Prefix Caching</h3><p>For applications with shared system prompts (e.g., chatbots with the same instruction prefix), the KV cache for the common prefix can be computed once and reused across all requests, saving both compute and memory.</p>`,
      },
      {
        id: "sec-kv-lessons",
        type: "lessons",
        title: "Lessons & Takeaways",
        content: `<ul><li>Memory fragmentation, not compute, is the primary bottleneck in KV cache management — solving fragmentation alone yields 2-4x throughput improvement</li><li>OS memory management is a rich source of applicable ideas for GPU memory management — paging, virtual memory, and copy-on-write all transfer directly</li><li>The KV cache verification-rejection cycle in speculative decoding adds additional complexity to cache management that requires careful handling</li><li>Prefix caching and copy-on-write are multiplicative optimizations that compound with PagedAttention</li></ul>`,
      },
      {
        id: "sec-kv-entities",
        type: "entities",
        title: "Key Entities",
        content: "",
        entities: [
          { name: "PagedAttention", type: "tech" },
          { name: "vLLM", type: "tech" },
          { name: "KV Cache", type: "tech" },
          { name: "Copy-on-Write", type: "concept" },
          { name: "Prefix Caching", type: "concept" },
          { name: "Memory Fragmentation", type: "concept" },
        ],
      },
    ],
    sourceItemIds: ["1", "3"],
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Leaf chapter: Speculative Decoding ──
  "cat-spec-decode": {
    id: "chapter-spec-decode",
    categoryId: "cat-spec-decode",
    title: "Speculative Decoding",
    description:
      "Using draft models to propose tokens verified by larger models for faster inference.",
    isParent: false,
    sections: [
      {
        id: "sec-spec-overview",
        type: "overview",
        title: "Overview",
        content: `<p>Speculative decoding is an inference optimization that <strong>trades compute for latency</strong>. A smaller, faster "draft" model proposes a sequence of tokens, which the larger "target" model then verifies in a single forward pass. Since transformer verification of N tokens costs roughly the same as generating 1 token, accepted speculations yield near-free latency reductions.</p>`,
      },
      {
        id: "sec-spec-techniques",
        type: "techniques",
        title: "Key Techniques",
        content: `<h3>Draft-Target Architecture</h3><p>A draft model (typically 7-13B parameters) generates K candidate tokens autoregressively. The target model (70B+) then evaluates all K tokens in parallel using a single forward pass. Tokens are accepted left-to-right until the first rejection, at which point the target model's prediction replaces the rejected token.</p><h3>Acceptance Rate Optimization</h3><p>The acceptance rate (typically <strong>70-85%</strong> with well-matched draft models) depends on the alignment between draft and target model distributions. Fine-tuning the draft model on the target's output distribution can improve acceptance rates by 5-10%.</p>`,
      },
      {
        id: "sec-spec-lessons",
        type: "lessons",
        title: "Lessons & Takeaways",
        content: `<ul><li>Speculative decoding is most effective when the target model is significantly larger (10x+) than the draft model — the verification cost is amortized across accepted tokens</li><li>The draft model should be architecturally similar to the target for high acceptance rates</li><li>KV cache management becomes more complex with speculation — rejected tokens create cache entries that must be invalidated</li><li>For latency-sensitive applications, speculative decoding can reduce p95 latency by 50-60%</li></ul>`,
      },
      {
        id: "sec-spec-entities",
        type: "entities",
        title: "Key Entities",
        content: "",
        entities: [
          { name: "Speculative Decoding", type: "tech" },
          { name: "Draft Models", type: "tech" },
          { name: "KV Cache", type: "tech" },
          { name: "Inference Optimization", type: "concept" },
          { name: "Acceptance Rate", type: "concept" },
        ],
      },
    ],
    sourceItemIds: ["1"],
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Leaf chapter: Quantization ──
  "cat-quantization": {
    id: "chapter-quantization",
    categoryId: "cat-quantization",
    title: "Quantization",
    description: "Model weight quantization techniques for efficient deployment.",
    isParent: false,
    sections: [
      {
        id: "sec-quant-overview",
        type: "overview",
        title: "Overview",
        content: `<p>Quantization reduces model weight precision (typically from 16-bit to 4-bit or 8-bit) to decrease memory footprint and improve inference throughput. The key challenge is minimizing quality degradation while maximizing compression — different methods make different tradeoffs between calibration cost, quality preservation, and deployment target (GPU vs CPU).</p>`,
      },
      {
        id: "sec-quant-techniques",
        type: "techniques",
        title: "Key Techniques",
        content: `<h3>GPTQ (GPU-optimized)</h3><p>Post-training quantization using a calibration dataset. Applies layer-wise quantization with optimal rounding. Best for <strong>GPU deployments</strong> with CUDA support. Requires a calibration step but produces high-quality 4-bit models.</p><h3>AWQ (Activation-Aware)</h3><p>Preserves quality by identifying and protecting <strong>salient weight channels</strong> — the small fraction of weights that disproportionately affect activations. Best quality preservation at 4-bit for instruction-tuned models.</p><h3>GGUF (CPU-friendly)</h3><p>Designed for <code>llama.cpp</code> and CPU inference. Supports mixed-precision quantization (different layers at different bit widths). Optimal for <strong>CPU inference</strong> and edge deployment where CUDA is unavailable.</p>`,
      },
      {
        id: "sec-quant-lessons",
        type: "lessons",
        title: "Lessons & Takeaways",
        content: `<ul><li>No single quantization method wins everywhere — the deployment environment (GPU vs CPU) dictates the best choice</li><li>AWQ preserves quality better at 4-bit for instruction-tuned models, while GPTQ is more general-purpose</li><li>GGUF with llama.cpp enables surprisingly capable inference on consumer hardware</li><li>8-bit quantization is nearly lossless for most models; 4-bit requires careful method selection</li></ul>`,
      },
      {
        id: "sec-quant-entities",
        type: "entities",
        title: "Key Entities",
        content: "",
        entities: [
          { name: "GPTQ", type: "tech" },
          { name: "AWQ", type: "tech" },
          { name: "GGUF", type: "tech" },
          { name: "llama.cpp", type: "tech" },
          { name: "Quantization", type: "concept" },
        ],
      },
    ],
    sourceItemIds: ["5"],
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Leaf chapter: Batching Strategies ──
  "cat-batching": {
    id: "chapter-batching",
    categoryId: "cat-batching",
    title: "Batching Strategies",
    description: "Request batching approaches for maximizing GPU throughput.",
    isParent: false,
    sections: [
      {
        id: "sec-batch-overview",
        type: "overview",
        title: "Overview",
        content: `<p>Batching is the practice of grouping multiple inference requests to share GPU compute. <strong>Static batching</strong> (the naive approach) pads all sequences to the longest and waits for all to complete, wasting up to 70% of GPU cycles. <strong>Continuous batching</strong> (iteration-level scheduling) solves this by allowing new requests to join and completed requests to leave at every decoding step.</p>`,
      },
      {
        id: "sec-batch-techniques",
        type: "techniques",
        title: "Key Techniques",
        content: `<h3>Continuous Batching</h3><p>Instead of processing requests as a fixed batch, continuous batching operates at the <strong>iteration level</strong>. After each decoding step, completed sequences are ejected and new sequences are admitted. This keeps GPU utilization near 100% regardless of sequence length variance.</p><h3>Iteration-Level Scheduling</h3><p>The scheduler maintains a priority queue of pending requests and inserts them into the active batch as slots free up. This requires careful KV cache memory management to handle variable-lifetime cache entries.</p>`,
      },
      {
        id: "sec-batch-lessons",
        type: "lessons",
        title: "Lessons & Takeaways",
        content: `<ul><li>Continuous batching can improve throughput by <strong>3-5x</strong> compared to static batching</li><li>The key insight is treating batch membership as dynamic rather than static — requests join and leave independently</li><li>Memory management becomes critical because cache lifetimes are no longer uniform across the batch</li></ul>`,
      },
      {
        id: "sec-batch-entities",
        type: "entities",
        title: "Key Entities",
        content: "",
        entities: [
          { name: "Continuous Batching", type: "tech" },
          { name: "GPU Scheduling", type: "concept" },
          { name: "Iteration-Level Scheduling", type: "concept" },
        ],
      },
    ],
    sourceItemIds: ["6"],
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Leaf chapter: RAG Systems ──
  "cat-rag": {
    id: "chapter-rag",
    categoryId: "cat-rag",
    title: "RAG Systems",
    description: "Retrieval-augmented generation architectures and techniques.",
    isParent: false,
    sections: [
      {
        id: "sec-rag-overview",
        type: "overview",
        title: "Overview",
        content: `<p>Retrieval-Augmented Generation (RAG) enhances LLM responses by grounding them in retrieved documents from a knowledge base. The core pipeline is: <strong>query → retrieve → augment prompt → generate</strong>. The retrieval quality directly determines the quality of the generated answer — garbage in, garbage out.</p>`,
      },
      {
        id: "sec-rag-techniques",
        type: "techniques",
        title: "Key Techniques",
        content: `<h3>Hybrid Search (BM25 + Vector)</h3><p>Pure vector retrieval misses exact keyword matches; pure lexical search misses semantic similarity. <strong>Hybrid search</strong> combines both, using Reciprocal Rank Fusion (RRF) to merge result lists. Empirically, this outperforms either method alone across diverse query types.</p><h3>Reciprocal Rank Fusion (RRF)</h3><p>A simple but effective method for combining ranked lists from different retrieval methods. Each document's score is <code>1 / (k + rank)</code> where k is a constant (typically 60). Scores from all lists are summed. RRF outperforms linear score combination because it's rank-based rather than score-based, making it robust to score distribution differences.</p>`,
      },
      {
        id: "sec-rag-lessons",
        type: "lessons",
        title: "Lessons & Takeaways",
        content: `<ul><li>Hybrid search (BM25 + vector) consistently outperforms pure vector retrieval in production — lexical matching catches keyword-specific queries that embeddings miss</li><li>RRF is preferred over linear combination for merging results because it's robust to score scale differences</li><li>Retrieval quality matters more than generation model size — a smaller model with better retrieval often beats a larger model with worse retrieval</li></ul>`,
      },
      {
        id: "sec-rag-entities",
        type: "entities",
        title: "Key Entities",
        content: "",
        entities: [
          { name: "Hybrid Search", type: "tech" },
          { name: "BM25", type: "tech" },
          { name: "RAG", type: "concept" },
          { name: "Reciprocal Rank Fusion", type: "tech" },
          { name: "Vector Retrieval", type: "concept" },
        ],
      },
    ],
    sourceItemIds: ["4"],
    lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── Leaf chapter: System Design ──
  "cat-system-design": {
    id: "chapter-system-design",
    categoryId: "cat-system-design",
    title: "System Design",
    description: "Large-scale system architecture patterns and best practices.",
    isParent: false,
    sections: [
      {
        id: "sec-sd-overview",
        type: "overview",
        title: "Overview",
        content: `<p>System design knowledge covers architectural patterns for building scalable, reliable, and performant distributed systems. Key areas include <strong>real-time feature serving</strong>, data pipeline architecture, caching strategies, and the separation of concerns between computation and serving layers.</p>`,
      },
      {
        id: "sec-sd-techniques",
        type: "techniques",
        title: "Key Techniques",
        content: `<h3>Feature Store Architecture</h3><p>A feature store separates <strong>feature computation</strong> (batch or streaming pipelines that produce features) from <strong>feature serving</strong> (low-latency reads for online inference). This separation enables independent scaling — computation can run on Spark/Flink while serving uses Redis or a purpose-built store.</p><h3>Hot/Warm/Cold Caching</h3><p>Redis as a hot cache layer with PostgreSQL as the source of truth. Redis with pipelining can serve features at <strong>p99 &lt; 5ms</strong> for batch requests of 100+ features. The cache is populated by change-data-capture (CDC) from PostgreSQL.</p>`,
      },
      {
        id: "sec-sd-lessons",
        type: "lessons",
        title: "Lessons & Takeaways",
        content: `<ul><li>Feature stores should separate computation from serving for independent scaling — these have fundamentally different resource profiles</li><li>Redis with pipelining achieves remarkable latency (p99 &lt; 5ms) for batch feature lookups</li><li>The biggest architectural mistake in ML systems is coupling feature computation to the serving path — it creates a latency floor that's hard to optimize away</li></ul>`,
      },
      {
        id: "sec-sd-entities",
        type: "entities",
        title: "Key Entities",
        content: "",
        entities: [
          { name: "Feature Store", type: "tech" },
          { name: "Redis", type: "tech" },
          { name: "Real-time ML", type: "concept" },
          { name: "Change-Data-Capture", type: "concept" },
        ],
      },
    ],
    sourceItemIds: ["2"],
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
}

export function getChapterForCategory(categoryId: string): Chapter | undefined {
  return mockChapters[categoryId]
}
