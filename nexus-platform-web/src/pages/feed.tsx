import { useState } from "react"
import { Link } from "react-router-dom"
import { Check, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceBadge } from "@/components/source-badge"
import { cn } from "@/lib/utils"
import { mockFeedItems, mockStats, mockTopCategories, mockProcessing } from "@/lib/mock-data"
import type { SourceType, ContentItem } from "@/lib/types"

type FilterType = "all" | SourceType

const statusColor: Record<string, string> = {
  EXTRACTING: "text-amber-400",
  DISTILLING: "text-purple-400",
  ORGANIZING: "text-emerald-400",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours === 1) return "1 hour ago"
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

function FeedCard({ item }: { item: ContentItem }) {
  const [expanded, setExpanded] = useState(false)
  const hasExpandableContent = item.synopsis || item.keyInsights.length > 0 || item.tags.length > 0

  return (
    <Card className="gap-0 border-border/40 bg-card/30 py-0 transition-colors hover:bg-card/50">
      <CardContent className="p-0">
        {/* Collapsed header — always visible */}
        <div
          className={cn(
            "flex cursor-pointer items-start gap-3 p-4",
            expanded && hasExpandableContent && "pb-0",
          )}
          onClick={() => hasExpandableContent && setExpanded(!expanded)}
        >
          {/* Expand chevron */}
          {hasExpandableContent && (
            <ChevronRight
              className={cn(
                "mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                expanded && "rotate-90",
              )}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2.5">
              <SourceBadge sourceType={item.sourceType} />
              <span className="text-xs text-muted-foreground">{timeAgo(item.savedAt)}</span>
              {item.category && (
                <Badge variant="secondary" className="ml-auto text-[11px] font-medium">
                  {item.category}
                </Badge>
              )}
            </div>

            <Link
              to={`/content/${item.id}`}
              className="group/title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[15px] font-medium leading-snug text-foreground group-hover/title:text-primary transition-colors">
                {item.title}
              </h3>
            </Link>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pl-11 pt-3">
              {/* Synopsis */}
              {item.synopsis && (
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  {item.synopsis.what}
                </p>
              )}

              {/* Key insights */}
              {item.keyInsights.length > 0 && (
                <ul className="mb-3 space-y-1.5">
                  {item.keyInsights.slice(0, 3).map((insight, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/50" />
                      {insight}
                    </li>
                  ))}
                </ul>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-border/40 text-[11px] font-normal text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FeedPage() {
  const [filter, setFilter] = useState<FilterType>("all")

  const filteredItems =
    filter === "all" ? mockFeedItems : mockFeedItems.filter((item) => item.sourceType === filter)

  return (
    <div className="flex h-full">
      {/* Main content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <h1 className="mb-5 text-2xl font-semibold text-foreground">Feed</h1>

          {/* Sync badge + filter tabs */}
          <div className="mb-5 flex items-center gap-3">
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            >
              <Check className="size-3" />
              Synced 3m ago
            </Badge>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <TabsList className="h-7">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="twitter" className="text-xs">
                  Twitter
                </TabsTrigger>
                <TabsTrigger value="web" className="text-xs">
                  Web
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Feed items */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Right sidebar */}
      <aside className="hidden w-64 shrink-0 border-l border-border/40 xl:block">
        <ScrollArea className="h-full">
          <div className="p-5">
            {/* Knowledge Base stats */}
            <div className="mb-6">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Knowledge Base
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Total Items", value: mockStats.totalItems },
                  { label: "This week", value: mockStats.thisWeek },
                  { label: "Categories", value: mockStats.categories },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Top Categories */}
            <div className="mb-6">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Top Categories
              </h3>
              <div className="space-y-2">
                {mockTopCategories.map((cat) => (
                  <div key={cat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", cat.color)} />
                      <span className="text-sm text-muted-foreground">{cat.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground/60">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing */}
            {mockProcessing.length > 0 && (
              <>
                <Separator className="mb-6" />
                <div>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    Processing
                  </h3>
                  <div className="space-y-2.5">
                    {mockProcessing.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-muted-foreground">{item.title}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 border-transparent text-[10px] font-semibold",
                            statusColor[item.status] ?? "text-muted-foreground",
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}
