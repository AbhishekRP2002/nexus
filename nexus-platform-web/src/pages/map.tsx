import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ChevronRight,
  BookOpen,
  Wrench,
  Lightbulb,
  Tags,
  Library,
  Pencil,
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SourceBadge } from "@/components/source-badge"
import { TiptapEditor } from "@/components/tiptap-editor"
import { cn } from "@/lib/utils"
import {
  mockTaxonomy,
  mockFeedItems,
  getCategoryDescription,
  getChapterForCategory,
} from "@/lib/mock-data"
import type { TaxonomyNode, Chapter, ChapterSection, ChapterSectionType } from "@/lib/types"

const sectionIcons: Record<ChapterSectionType, React.ElementType> = {
  overview: BookOpen,
  techniques: Wrench,
  lessons: Lightbulb,
  entities: Tags,
  subchapters: Library,
}

const entityColors: Record<string, string> = {
  tech: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  person: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  concept: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  company: "bg-purple-500/15 text-purple-400 border-purple-500/20",
}

function TaxonomyTreeItem({
  node,
  selectedId,
  onSelect,
  depth = 0,
}: {
  node: TaxonomyNode
  selectedId: string | null
  onSelect: (id: string) => void
  depth?: number
}) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isSelected = node.id === selectedId

  if (!hasChildren) {
    return (
      <button
        onClick={() => onSelect(node.id)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
          isSelected
            ? "bg-primary/15 font-medium text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="size-3.5 shrink-0" />
        {node.isNew && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        <span className="flex-1 truncate">{node.label}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground/50">{node.itemCount}</span>
      </button>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          onClick={() => onSelect(node.id)}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
            isSelected
              ? "bg-primary/15 font-medium text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <ChevronRight
            className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")}
          />
          {node.isNew && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          <span className="flex-1 truncate">{node.label}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground/50">{node.itemCount}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {node.children.map((child) => (
          <TaxonomyTreeItem
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function findNode(nodes: TaxonomyNode[], id: string): TaxonomyNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return undefined
}

function ChapterSectionBlock({
  section,
  isEditing,
  onContentChange,
}: {
  section: ChapterSection
  isEditing: boolean
  onContentChange: (sectionId: string, html: string) => void
}) {
  const Icon = sectionIcons[section.type]

  // Entity section — render as badges
  if (section.type === "entities" && section.entities) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground/60" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {section.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {section.entities.map((entity) => (
            <Badge
              key={entity.name}
              variant="outline"
              className={cn("text-xs", entityColors[entity.type])}
            >
              {entity.name}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  // Subchapters section — rendered separately in parent, skip here
  if (section.type === "subchapters") return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground/60" />
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {section.title}
        </h3>
      </div>
      <TiptapEditor
        content={section.content}
        editable={isEditing}
        onUpdate={(html) => onContentChange(section.id, html)}
        placeholder={`Add ${section.title.toLowerCase()} content...`}
      />
    </div>
  )
}

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "today"
  if (days === 1) return "1d"
  return `${days}d`
}

export default function MapPage() {
  const [selectedId, setSelectedId] = useState("cat-ml")
  const [isEditing, setIsEditing] = useState(false)
  const [chapterData, setChapterData] = useState<Chapter | undefined>(() =>
    getChapterForCategory("cat-ml"),
  )

  const selectedNode = findNode(mockTaxonomy, selectedId)
  const description = selectedNode ? getCategoryDescription(selectedNode.label) : ""
  const subtopicCount = selectedNode?.children.length ?? 0

  // Update chapter data when selection changes
  useEffect(() => {
    setChapterData(getChapterForCategory(selectedId))
    setIsEditing(false)
  }, [selectedId])

  const categoryItems = mockFeedItems.filter((item) => item.categoryId === selectedId)

  function handleSectionContentChange(sectionId: string, html: string) {
    setChapterData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, content: html } : s)),
      }
    })
  }

  return (
    <div className="flex h-full">
      {/* Taxonomy sidebar */}
      <aside className="w-60 shrink-0 border-r border-border/40">
        <ScrollArea className="h-full">
          <div className="p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Table of Contents
            </h3>
            <div className="space-y-0.5">
              {mockTaxonomy.map((node) => (
                <TaxonomyTreeItem
                  key={node.id}
                  node={node}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main content — Chapter view */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-6">
          {selectedNode ? (
            <>
              {/* Chapter header */}
              <div className="mb-2 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">{selectedNode.label}</h1>
                {chapterData && (
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 text-[13px]"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                )}
              </div>

              {description && (
                <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}

              {/* Stats row */}
              <Card className="mb-8 gap-0 border-border/40 bg-card/30 py-0">
                <CardContent className="flex items-center gap-8 p-5">
                  <div>
                    <div className="text-2xl font-semibold text-foreground">
                      {selectedNode.itemCount}
                    </div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      Items
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div>
                    <div className="text-2xl font-semibold text-foreground">{subtopicCount}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      Subtopics
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div>
                    <div className="text-2xl font-semibold text-foreground">
                      {chapterData ? daysAgo(chapterData.lastUpdated) : "—"}
                    </div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      Last Updated
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chapter content */}
              {chapterData ? (
                <div className="space-y-8">
                  {/* Render non-subchapter sections */}
                  {chapterData.sections
                    .filter((s) => s.type !== "subchapters")
                    .map((section) => (
                      <ChapterSectionBlock
                        key={section.id}
                        section={section}
                        isEditing={isEditing}
                        onContentChange={handleSectionContentChange}
                      />
                    ))}

                  {/* Sub-chapters navigation (for parent chapters) */}
                  {chapterData.isParent && selectedNode.children.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <Library className="size-4 text-muted-foreground/60" />
                        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                          Sub-chapters
                        </h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedNode.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setSelectedId(child.id)}
                            className="group text-left"
                          >
                            <Card className="gap-0 border-border/40 bg-card/30 py-0 transition-colors group-hover:bg-card/60">
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {child.label}
                                  </h4>
                                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                                    {child.itemCount} items
                                    {child.children.length > 0 &&
                                      ` · ${child.children.length} sub-topics`}
                                  </p>
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                              </CardContent>
                            </Card>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source items (for leaf chapters or any chapter with direct items) */}
                  {categoryItems.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="mb-4 flex items-center gap-2">
                          <BookOpen className="size-4 text-muted-foreground/60" />
                          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                            Sources ({categoryItems.length} items)
                          </h3>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {categoryItems.map((item) => (
                            <Link key={item.id} to={`/content/${item.id}`}>
                              <Card className="h-full gap-0 border-border/40 bg-card/30 py-0 transition-colors hover:bg-card/60">
                                <CardContent className="p-4">
                                  <div className="mb-2.5 flex items-center justify-between">
                                    <SourceBadge sourceType={item.sourceType} />
                                    <span className="text-[11px] text-muted-foreground/50">
                                      {item.author}
                                    </span>
                                  </div>
                                  <h4 className="mb-2 text-[13px] font-medium leading-snug text-foreground">
                                    {item.title}
                                  </h4>
                                  {item.keyInsights[0] && (
                                    <p className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/50" />
                                      {item.keyInsights[0]}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Empty state — no chapter yet */
                <Card className="border-border/40 bg-card/30">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No chapter content yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      This chapter will be auto-generated as more sources are added to this
                      category.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a category to browse content.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
