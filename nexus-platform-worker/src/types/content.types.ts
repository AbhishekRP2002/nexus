export type SourceType = "twitter" | "web" | "linkedin";

export interface ContentItem {
  id: string;
  sourceType: SourceType;
  sourceUrl: string;
  title: string;
  author?: string;
  savedAt: string;
  synopsis?: {
    what: string;
    why: string;
    how: string;
  };
  keyInsights: string[];
  bodyText?: string;
}
