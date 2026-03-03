import { useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Search, Sparkles, FileText, ExternalLink, Loader2 } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SourceBadge } from "@/components/source-badge"
import { streamSearch, type SearchStreamState } from "@/lib/search-api"
import type { SearchResultItem, CitationSource, SearchPhase, SourceType } from "@/lib/types"

// Temporary user ID until auth is connected
const TEMP_USER_ID = "test-user"

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get("q") ?? ""

  const [phase, setPhase] = useState<SearchPhase>("idle")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [answerText, setAnswerText] = useState("")
  const [citations, setCitations] = useState<Record<string, CitationSource>>({})
  const [followUps, setFollowUps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)

  const handleUpdate = useCallback((state: SearchStreamState) => {
    setPhase(state.phase)
    setResults(state.results)
    setAnswerText(state.answerText)
    setCitations(state.citations)
    setFollowUps(state.followUpQuestions)
    setError(state.error)
  }, [])

  useEffect(() => {
    if (!query) {
      setPhase("idle")
      setResults([])
      setAnswerText("")
      setCitations({})
      setFollowUps([])
      setError(null)
      return
    }

    // Cancel previous stream
    controllerRef.current?.abort()

    // Reset state
    setPhase("retrieving")
    setAnswerText("")
    setCitations({})
    setFollowUps([])
    setError(null)

    const controller = streamSearch(query, TEMP_USER_ID, handleUpdate)
    controllerRef.current = controller

    return () => controller.abort()
  }, [query, handleUpdate])

  if (!query) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <div className="rounded-full bg-muted/50 p-4">
          <Search className="size-8 text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground">Search your knowledge base</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the search bar above to ask questions or find content.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = phase === "retrieving" || phase === "generating"

  return (
    <div className="mx-auto max-w-3xl p-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Results for
      </p>
      <h1 className="mb-6 text-xl font-semibold text-foreground">{query}</h1>

      <Tabs defaultValue="answer">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="answer" className="gap-1.5">
            <Sparkles className="size-3.5" />
            AI Answer
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5">
            <FileText className="size-3.5" />
            Results ({results.length})
          </TabsTrigger>
        </TabsList>

        {/* AI Answer Tab */}
        <TabsContent value="answer" className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {phase === "retrieving"
              ? "Searching your knowledge base..."
              : phase === "generating"
                ? "Synthesizing answer..."
                : "Synthesized from your knowledge base"}
          </div>

          <Card className="gap-0 border-border/40 bg-card/30 py-0">
            <CardContent className="p-5">
              {isLoading && !answerText ? (
                <AnswerSkeleton phase={phase} />
              ) : error && !answerText ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <AnswerContent
                  text={answerText}
                  citations={citations}
                  isStreaming={phase === "generating"}
                />
              )}
            </CardContent>
          </Card>

          {/* Follow-up questions */}
          {followUps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Follow-up questions
              </p>
              <div className="flex flex-wrap gap-2">
                {followUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                    className="rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-3">
          {results.length === 0 && phase === "done" ? (
            <Card className="gap-0 border-border/40 bg-card/30 py-0">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No matching content found. Try a different query or add more content to your
                  knowledge base.
                </p>
              </CardContent>
            </Card>
          ) : results.length === 0 && isLoading ? (
            <ResultsSkeleton />
          ) : (
            results.map((item) => <ResultCard key={item.id} item={item} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ─── Answer Content with markdown + inline citations ─── */

function AnswerContent({
  text,
  citations,
  isStreaming,
}: {
  text: string
  citations: Record<string, CitationSource>
  isStreaming: boolean
}) {
  // Pre-process: replace [N] citation markers with placeholder tokens
  // that won't be consumed by markdown parsing
  const processedText = useMemo(() => {
    return text.replace(/\[(\d+)\]/g, "{{cite:$1}}")
  }, [text])

  // Custom component to render text nodes — intercepts citation placeholders
  const renderTextWithCitations = useCallback(
    (content: string): ReactNode[] => {
      const parts: ReactNode[] = []
      const regex = /\{\{cite:(\d+)\}\}/g
      let lastIndex = 0
      let match
      let key = 0

      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index))
        }
        parts.push(
          <CitationChip key={`c-${key++}`} number={match[1]} source={citations[match[1]]} />,
        )
        lastIndex = regex.lastIndex
      }

      if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex))
      }

      return parts
    },
    [citations],
  )

  return (
    <div className="prose-answer text-sm leading-relaxed text-foreground/90">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{injectCitations(children, renderTextWithCitations)}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {injectCitations(children, renderTextWithCitations)}
            </strong>
          ),
          em: ({ children }) => <em>{injectCitations(children, renderTextWithCitations)}</em>,
          h1: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
              {injectCitations(children, renderTextWithCitations)}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
              {injectCitations(children, renderTextWithCitations)}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-3 text-sm font-semibold text-foreground first:mt-0">
              {injectCitations(children, renderTextWithCitations)}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90">
              {injectCitations(children, renderTextWithCitations)}
            </li>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-")
            if (isBlock) {
              return (
                <pre className="my-3 overflow-x-auto rounded-md bg-muted/50 p-3 text-xs">
                  <code>{children}</code>
                </pre>
              )
            }
            return (
              <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-medium">
                {children}
              </code>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/30 pl-3 italic text-foreground/70">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),
        }}
      >
        {processedText}
      </Markdown>
      {isStreaming && <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-primary" />}
    </div>
  )
}

/** Walk React children, replacing string nodes with citation-injected versions */
function injectCitations(children: ReactNode, renderFn: (text: string) => ReactNode[]): ReactNode {
  if (typeof children === "string") {
    if (children.includes("{{cite:")) {
      return <>{renderFn(children)}</>
    }
    return children
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string" && child.includes("{{cite:")) {
        return <span key={i}>{renderFn(child)}</span>
      }
      return child
    })
  }
  return children
}

/* ─── Citation chip ─── */

function CitationChip({ number, source }: { number: string; source?: CitationSource }) {
  if (!source) {
    return (
      <Badge
        variant="outline"
        className="mx-0.5 inline-flex px-1.5 py-0 text-[10px] font-semibold align-[1px]"
      >
        {number}
      </Badge>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-0.5 inline-flex align-[1px]"
          >
            <Badge
              variant="outline"
              className="cursor-pointer px-1.5 py-0 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {number}
            </Badge>
          </a>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs border border-border bg-popover text-popover-foreground shadow-md [&_.fill-foreground]:fill-popover [&_.bg-foreground]:bg-popover"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{source.title}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <SourceBadge sourceType={source.sourceType as SourceType} />
                <ExternalLink className="size-2.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/* ─── Result card ─── */

function ResultCard({ item }: { item: SearchResultItem }) {
  return (
    <Card className="gap-0 border-border/40 bg-card/30 py-0 transition-colors hover:bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <SourceBadge sourceType={item.sourceType as SourceType} />
              <span className="text-[10px] text-muted-foreground">
                {Math.round(item.relevanceScore * 100)}% match
              </span>
            </div>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:underline"
            >
              {item.title}
            </a>
            {item.synopsis && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.synopsis}</p>
            )}
          </div>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Skeletons ─── */

function AnswerSkeleton({ phase }: { phase: SearchPhase }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Loader2 className="size-4 animate-spin text-primary/60" />
        <span className="text-xs text-muted-foreground">
          {phase === "retrieving"
            ? "Searching through your knowledge base..."
            : "Generating a synthesized answer..."}
        </span>
      </div>
      <div className="space-y-2.5">
        <div className="h-3 w-full animate-pulse rounded bg-muted/60" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-muted/60" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted/60" />
        {phase === "generating" && (
          <>
            <div className="h-3 w-9/12 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-10/12 animate-pulse rounded bg-muted/60" />
          </>
        )}
      </div>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="gap-0 border-border/40 bg-card/30 py-0">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/60" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
