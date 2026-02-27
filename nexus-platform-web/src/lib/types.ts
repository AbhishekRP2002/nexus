export type SourceType = "twitter" | "web" | "linkedin"

export type ContentStatus =
  | "PENDING"
  | "EXTRACTING"
  | "EXTRACTED"
  | "DISTILLING"
  | "DISTILLED"
  | "ORGANIZING"
  | "ORGANIZED"
  | "READY"
  | "FAILED"

export interface ContentItem {
  id: string
  sourceType: SourceType
  sourceUrl: string
  title: string
  author?: string
  authorHandle?: string
  publishedAt?: string
  savedAt: string
  status: ContentStatus
  category?: string
  categoryId?: string
  synopsis?: {
    what: string
    why: string
    how: string
  }
  keyInsights: string[]
  entities: Entity[]
  tags: string[]
  relatedContent?: RelatedItem[]
  metadata?: Record<string, string>
}

export interface Entity {
  name: string
  type: "tech" | "person" | "concept" | "company"
}

export interface RelatedItem {
  id: string
  title: string
  sourceType: SourceType
  similarity: number
}

export interface TaxonomyNode {
  id: string
  label: string
  description?: string
  parentId: string | null
  itemCount: number
  depth: number
  children: TaxonomyNode[]
  isNew?: boolean
}

export interface KnowledgeBaseStats {
  totalItems: number
  thisWeek: number
  categories: number
}

export interface ProcessingItem {
  id: string
  title: string
  status: ContentStatus
}

// ---------- Chapter / Living Book types ----------

export type ChapterSectionType = "overview" | "techniques" | "lessons" | "entities" | "subchapters"

export interface ChapterSection {
  id: string
  type: ChapterSectionType
  title: string
  /** HTML string for Tiptap editor */
  content: string
  /** For "entities" section — rendered as badge chips */
  entities?: Entity[]
}

export interface Chapter {
  id: string
  /** References TaxonomyNode.id */
  categoryId: string
  title: string
  description: string
  sections: ChapterSection[]
  /** ContentItem IDs that sourced this chapter */
  sourceItemIds: string[]
  lastUpdated: string
  /** true = has sub-chapters (parent), false = leaf chapter with full sections */
  isParent: boolean
}
