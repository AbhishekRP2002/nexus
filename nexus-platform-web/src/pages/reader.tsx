import { Link, useParams } from "react-router-dom"
import { ChevronRight, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceBadge } from "@/components/source-badge"
import { mockFeedItems } from "@/lib/mock-data"

export default function ReaderPage() {
  const { id } = useParams()
  const item = mockFeedItems.find((i) => i.id === id)

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Content not found.</p>
      </div>
    )
  }

  const entityColors: Record<string, string> = {
    tech: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    person: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    concept: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    company: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-6">
          {/* Breadcrumb */}
          {item.category && (
            <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <Link to="/map" className="hover:text-foreground">
                {item.category}
              </Link>
              {item.tags[0] && (
                <>
                  <ChevronRight className="size-3" />
                  <span>{item.tags[0]}</span>
                </>
              )}
            </nav>
          )}

          {/* Source + author */}
          <div className="mb-3 flex items-center gap-2.5">
            <SourceBadge sourceType={item.sourceType} />
            {item.author && (
              <span className="text-sm text-muted-foreground">
                by <span className="text-foreground">{item.author}</span>
              </span>
            )}
            {item.publishedAt && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="text-sm text-muted-foreground">{item.publishedAt}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-6 text-2xl font-semibold leading-tight text-foreground">
            {item.title}
          </h1>

          {/* Distilled / Full Content tabs */}
          <Tabs defaultValue="distilled">
            <TabsList className="mb-6">
              <TabsTrigger value="distilled">Distilled</TabsTrigger>
              <TabsTrigger value="full">Full Content</TabsTrigger>
            </TabsList>

            <TabsContent value="distilled" className="space-y-6">
              {/* Synopsis */}
              {item.synopsis && (
                <Card className="gap-0 border-border/40 bg-card/30 py-0">
                  <CardContent className="p-5">
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                      Synopsis
                    </h3>
                    <dl className="space-y-4">
                      {(
                        [
                          ["WHAT", item.synopsis.what],
                          ["WHY", item.synopsis.why],
                          ["HOW", item.synopsis.how],
                        ] as const
                      ).map(([label, text]) => (
                        <div key={label} className="flex gap-4">
                          <dt className="w-12 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-primary">
                            {label}
                          </dt>
                          <dd className="text-sm leading-relaxed text-muted-foreground">{text}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              )}

              {/* Key Insights */}
              {item.keyInsights.length > 0 && (
                <div>
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    {item.keyInsights.map((insight, i) => (
                      <Card key={i} className="gap-0 border-border/40 bg-card/30 py-0">
                        <CardContent className="flex items-start gap-3 p-4">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-muted-foreground">{insight}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="full">
              <Card className="gap-0 border-border/40 bg-card/30 py-0">
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Full extracted content will be displayed here once connected to the backend.
                    This view shows the complete original content rendered as clean Markdown.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Right sidebar */}
      <aside className="hidden w-72 shrink-0 border-l border-border/40 lg:block">
        <ScrollArea className="h-full">
          <div className="p-5">
            {/* Actions */}
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer">
                Notes
              </Badge>
              <Badge variant="outline" className="cursor-pointer">
                Highlights
              </Badge>
              <Button variant="outline" size="xs" className="gap-1.5" asChild>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3" />
                  Original
                </a>
              </Button>
            </div>

            <Separator className="mb-5" />

            {/* Category */}
            {item.category && (
              <div className="mb-5">
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Category
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{item.category}</Badge>
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="mb-5" />

            {/* Metadata */}
            {item.metadata && (
              <div className="mb-5">
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Metadata
                </h4>
                <dl className="space-y-2">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="text-sm text-muted-foreground">{key}</dt>
                      <dd className="truncate text-sm font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <Separator className="mb-5" />

            {/* Entities */}
            {item.entities.length > 0 && (
              <div className="mb-5">
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Entities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.entities.map((entity) => (
                    <Badge
                      key={entity.name}
                      variant="outline"
                      className={entityColors[entity.type] ?? "text-muted-foreground"}
                    >
                      {entity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="mb-5" />

            {/* Related Content */}
            {item.relatedContent && item.relatedContent.length > 0 && (
              <div>
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Related Content
                </h4>
                <div className="space-y-2.5">
                  {item.relatedContent.map((related) => (
                    <Link key={related.id} to={`/content/${related.id}`}>
                      <Card className="gap-0 border-border/40 bg-card/20 py-0 transition-colors hover:bg-card/50">
                        <CardContent className="p-3">
                          <p className="mb-1 text-xs font-medium leading-snug text-foreground">
                            {related.title}
                          </p>
                          <div className="flex items-center justify-between">
                            <SourceBadge sourceType={related.sourceType} />
                            <span className="text-[10px] text-muted-foreground/60">
                              {Math.round(related.similarity * 100)}% match
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}
